import ExcelJS from "exceljs";
import { calculateSalePrice } from "@/lib/pricing";
import {
  isActiveFor,
  LITERS_THRESHOLD,
  MonasterioFormatError,
  parseMonasterio,
  SHEET_NAME,
  slugify,
  toAbvPercent,
  type MonasterioRow,
} from "@/lib/monasterio";
import type { StockStatus } from "@/lib/types";

/**
 * Lectura del archivo de carga masiva (.xlsx o .csv).
 * - .xlsx con la pestaña "LISTA MONASTERIO": formato del proveedor (`parseMonasterio`).
 * - Cualquier otro .xlsx (primera hoja) o .csv: formato de la plantilla
 *   (Nombre, País, Estilo, ABV, Volumen (ml), Precio, Stock).
 * "Precio" es el costo del proveedor; el precio de venta lo calcula el servidor.
 */

type Field = "name" | "country" | "style" | "abv" | "volume_ml" | "cost_price" | "stock";

const HEADER_ALIASES: Record<string, Field> = {
  NOMBRE: "name",
  CERVEZA: "name",
  PAIS: "country",
  ESTILO: "style",
  ABV: "abv",
  "%ABV": "abv",
  "VOLUMEN (ML)": "volume_ml",
  VOLUMEN: "volume_ml",
  ML: "volume_ml",
  "ML.": "volume_ml",
  PRECIO: "cost_price",
  COSTO: "cost_price",
  STOCK: "stock",
  CANTIDAD: "stock",
  DISPONIBILIDAD: "stock",
};

const LOW_STOCK_MAX_UNITS = 5;

export type CatalogParseResult = { rows: MonasterioRow[]; skipped: number; errors: string[] };

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

/** Decodifica como UTF-8 y, si el archivo trae caracteres inválidos (Excel en Windows), como Windows-1252. */
function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/** CSV mínimo (RFC 4180): comillas dobles, saltos de línea dentro de campos y separador `,` o `;`. */
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function xlsxToTable(data: ArrayBuffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new MonasterioFormatError("El archivo no tiene hojas.");

  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let col = 1; col <= row.cellCount; col++) cells.push(row.getCell(col).text.trim());
    table.push(cells);
  });
  return table;
}

/** "$1,234.50" → 1234.5 · "12,5" → 12.5 (coma decimal) · vacío o ilegible → NaN. */
function parseDecimal(raw: string): number {
  const text = raw.replace(/[^0-9.,\-]/g, "");
  if (!text) return NaN;
  const decimalComma = /^-?\d+,\d{1,2}$/.test(text);
  return Number(decimalComma ? text.replace(",", ".") : text.replace(/,/g, ""));
}

function stockStatusFrom(raw: string): StockStatus | null {
  const text = normalizeHeader(raw);
  if (text === "") return "in_stock";
  if (/^\d+$/.test(text)) {
    const units = Number(text);
    if (units === 0) return "out_of_stock";
    return units <= LOW_STOCK_MAX_UNITS ? "low_stock" : "in_stock";
  }
  if (text.startsWith("AGOTAD") || text === "SIN STOCK") return "out_of_stock";
  if (text.startsWith("POCAS") || text.startsWith("ULTIMAS")) return "low_stock";
  if (text.startsWith("PREVENTA")) return "preorder";
  if (text.startsWith("DISPONIBLE") || text === "EN STOCK") return "in_stock";
  return null;
}

function parseTable(table: string[][]): CatalogParseResult {
  const columns: Partial<Record<Field, number>> = {};
  const headerIndex = table.findIndex((cells) => {
    const found: Partial<Record<Field, number>> = {};
    cells.forEach((cell, index) => {
      const field = HEADER_ALIASES[normalizeHeader(cell)];
      if (field && found[field] === undefined) found[field] = index;
    });
    if (found.name === undefined || found.cost_price === undefined) return false;
    Object.assign(columns, found);
    return true;
  });
  if (headerIndex === -1) {
    throw new MonasterioFormatError('No se encontraron las columnas "Nombre" y "Precio". Descarga la plantilla para ver el formato.');
  }

  const cell = (cells: string[], field: Field) => (columns[field] === undefined ? "" : (cells[columns[field]!] ?? "").trim());

  const rows: MonasterioRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let index = headerIndex + 1; index < table.length; index++) {
    const cells = table[index];
    const rowNumber = index + 1;
    const name = cell(cells, "name").replace(/\s+/g, " ");
    if (!name) {
      skipped++;
      continue;
    }

    const fail = (reason: string) => errors.push(`Fila ${rowNumber} (${name}): ${reason}`);

    const country = cell(cells, "country");
    const style = cell(cells, "style");
    if (!country) {
      fail("falta el país.");
      continue;
    }
    if (!style) {
      fail("falta el estilo.");
      continue;
    }

    const costPrice = parseDecimal(cell(cells, "cost_price"));
    if (!Number.isFinite(costPrice) || costPrice <= 0) {
      fail("el precio debe ser un número mayor a 0.");
      continue;
    }

    const listedVolume = cell(cells, "volume_ml") === "" ? 0 : parseDecimal(cell(cells, "volume_ml"));
    if (!Number.isFinite(listedVolume) || listedVolume < 0) {
      fail("el volumen no es un número válido.");
      continue;
    }
    // Igual que en la lista del proveedor: valores menores a 20 se leen como litros.
    const volumeMl = listedVolume > 0 && listedVolume < LITERS_THRESHOLD ? Math.round(listedVolume * 1000) : Math.round(listedVolume);

    const abv = cell(cells, "abv") === "" ? 0 : toAbvPercent(parseDecimal(cell(cells, "abv")));
    if (!Number.isFinite(abv) || abv < 0 || abv > 99.99) {
      fail("el ABV debe estar entre 0 y 99.99.");
      continue;
    }

    const stockStatus = stockStatusFrom(cell(cells, "stock"));
    if (!stockStatus) {
      fail('el stock debe ser un número o "Disponible", "Pocas piezas", "Agotada" o "Preventa".');
      continue;
    }

    rows.push({
      rowNumber,
      sku: slugify(country, name, String(listedVolume)),
      name,
      country,
      style,
      volume_ml: volumeMl,
      abv,
      cost_price: costPrice,
      sale_price: calculateSalePrice(costPrice),
      stock_status: stockStatus,
      is_active: isActiveFor(cell(cells, "stock")),
    });
  }

  return { rows, skipped, errors };
}

/** Lee un .xlsx o .csv subido desde el panel. */
export async function parseCatalogFile(file: File): Promise<CatalogParseResult> {
  const data = await file.arrayBuffer();

  if (file.name.toLowerCase().endsWith(".csv")) {
    return parseTable(parseCsv(decodeCsv(data)));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  if (workbook.getWorksheet(SHEET_NAME)) {
    return { ...(await parseMonasterio(data)), errors: [] };
  }
  return parseTable(await xlsxToTable(data));
}
