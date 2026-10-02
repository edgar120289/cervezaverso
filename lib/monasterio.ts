import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateSalePrice } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";

/**
 * Ingesta de la lista "LISTA MONASTERIO" (MASTER PROMPT V2 · Bloque 2.2).
 * Lo usan tanto la API del panel (`/api/admin/import`) como el script de
 * consola (`scripts/import-monasterio.ts`), así la regla de precio vive en un
 * solo lugar: `calculateSalePrice` → Math.floor((costo * 1.5) / 5) * 5
 * (o el margen personalizado del producto, si el admin lo cambió).
 */

export const SHEET_NAME = "LISTA MONASTERIO";
const DATA_START_ROW = 12;
const HEADER_SEARCH_ROWS = 15;
export const LITERS_THRESHOLD = 20;

const HEADER_ALIASES: Record<string, keyof ColumnMap> = {
  PAIS: "country",
  "PAÍS": "country",
  CERVEZA: "name",
  "ML.": "volume_ml",
  ML: "volume_ml",
  ESTILO: "style",
  "%ABV": "abv",
  ABV: "abv",
  PRECIO: "cost_price",
  CANTIDAD: "stock_qty",
};

type ColumnMap = {
  country: number;
  name: number;
  volume_ml: number;
  style: number;
  abv: number;
  cost_price: number;
  stock_qty: number;
};

export type MonasterioRow = {
  rowNumber: number;
  sku: string;
  name: string;
  country: string;
  style: string;
  volume_ml: number;
  abv: number;
  cost_price: number;
  sale_price: number;
  stock_status: StockStatus;
};

export type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export class MonasterioFormatError extends Error {}

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

/** `cell.text` aplana rich text (nombres con formato mixto); `String(value)` daría "[object Object]". */
function cellText(row: ExcelJS.Row, col: number | undefined): string {
  return col ? row.getCell(col).text.replace(/\s+/g, " ").trim() : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value ?? "0").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** La columna %ABV tiene formato de porcentaje en Excel: 0.055 → 5.5. */
export function toAbvPercent(value: number): number {
  return value > 0 && value < 1 ? Math.round(value * 10000) / 100 : value;
}

const LOW_STOCK_NOTE = /ULTIMAS? PIEZAS?|POCAS PIEZAS/;

/**
 * En la lista, CANTIDAD es la columna de pedido del cliente: trae "agotada"
 * cuando no hay existencias y queda vacía cuando sí hay. Las notas sin
 * encabezado a la derecha ("ULTIMAS PIEZAS", "POCAS PIEZAS") marcan poco stock.
 */
function stockStatusFor(qtyCell: unknown, notes: string): StockStatus {
  const qtyText = String(qtyCell ?? "").trim().toUpperCase();
  if (qtyText.startsWith("AGOTAD")) return "out_of_stock";
  if (LOW_STOCK_NOTE.test(notes.toUpperCase())) return "low_stock";
  return "in_stock";
}

/** Texto de las celdas a la derecha de CANTIDAD (TOTAL es fórmula y se ignora). */
function trailingNotes(row: ExcelJS.Row, afterCol: number): string {
  const notes: string[] = [];
  row.eachCell((cell, colNumber) => {
    if (colNumber > afterCol && typeof cell.value === "string") notes.push(cell.value.trim());
  });
  return notes.join(" ");
}

export function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Lee el .xlsx y devuelve las filas válidas más las que se saltaron (sin nombre). */
export async function parseMonasterio(
  data: ArrayBuffer
): Promise<{ rows: MonasterioRow[]; skipped: number }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) throw new MonasterioFormatError(`No se encontró la pestaña "${SHEET_NAME}".`);

  let columnMap: Partial<ColumnMap> | null = null;
  for (let rowNumber = 1; rowNumber <= HEADER_SEARCH_ROWS; rowNumber++) {
    const candidate: Partial<ColumnMap> = {};
    sheet.getRow(rowNumber).eachCell((cell, colNumber) => {
      const field = HEADER_ALIASES[normalizeHeader(cell.value)];
      if (field) candidate[field] = colNumber;
    });
    if (candidate.name && candidate.cost_price && Object.keys(candidate).length >= 4) {
      columnMap = candidate;
      break;
    }
  }
  if (!columnMap) {
    throw new MonasterioFormatError("No se pudieron identificar los encabezados de la hoja.");
  }

  const rows: MonasterioRow[] = [];
  let skipped = 0;
  for (let rowNumber = DATA_START_ROW; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const name = cellText(row, columnMap.name);
    // Filas vacías y encabezados repetidos dentro de la hoja (p. ej. "PAIS | CERVEZA").
    if (!name || HEADER_ALIASES[normalizeHeader(name)] === "name") {
      skipped++;
      continue;
    }

    const country = cellText(row, columnMap.country);
    const listedVolume = toNumber(columnMap.volume_ml ? row.getCell(columnMap.volume_ml).value : 0);
    // Barriles y magnums vienen en litros (5, 1.5); el resto en ml (330, 750).
    const volumeMl = listedVolume > 0 && listedVolume < LITERS_THRESHOLD
      ? Math.round(listedVolume * 1000)
      : Math.round(listedVolume);
    const costPrice = toNumber(row.getCell(columnMap.cost_price!).value);
    const qtyCell = columnMap.stock_qty ? row.getCell(columnMap.stock_qty).value : null;
    const notes = trailingNotes(row, columnMap.stock_qty ?? columnMap.cost_price!);

    rows.push({
      rowNumber,
      // El SKU usa el volumen tal como viene en la lista para no duplicar productos ya importados.
      sku: slugify(country, name, String(listedVolume)),
      name,
      country,
      style: cellText(row, columnMap.style),
      volume_ml: volumeMl,
      abv: toAbvPercent(toNumber(columnMap.abv ? row.getCell(columnMap.abv).value : 0)),
      cost_price: costPrice,
      sale_price: calculateSalePrice(costPrice),
      stock_status: stockStatusFor(qtyCell, notes),
    });
  }

  return { rows, skipped };
}

/**
 * Busca el producto ya existente de una fila: primero por `sku` y, si no, por
 * nombre + volumen (así una lista que escribe el volumen en ml no duplica lo
 * que Monasterio registró en litros). Requiere un cliente con permiso de lectura.
 */
export async function findExistingProduct(
  client: SupabaseClient,
  row: Pick<MonasterioRow, "sku" | "name" | "volume_ml">
) {
  // `*` (y no "id, margin_pct") para que funcione aunque la migración 003 aún no se haya aplicado.
  const bySku = await client.from("products").select("*").eq("sku", row.sku).maybeSingle();
  if (bySku.error) throw bySku.error;
  if (bySku.data) return bySku.data;

  const byName = await client
    .from("products")
    .select("*")
    .ilike("name", row.name.replace(/[\\%_]/g, "\\$&"))
    .eq("volume_ml", row.volume_ml)
    .limit(1);
  if (byName.error) throw byName.error;
  return byName.data?.[0] ?? null;
}

/**
 * Inserta o actualiza cada fila en `products` (UPSERT por sku, o por nombre + volumen).
 * Al actualizar solo se escriben los campos de la lista (precio, disponibilidad,
 * estilo, país, ABV, volumen): descripciones, fichas del Sommelier, imagen,
 * insignias y margen personalizado quedan intactos. Requiere un cliente con service_role.
 */
export async function upsertMonasterio(
  admin: SupabaseClient,
  rows: MonasterioRow[],
  skipped = 0
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped, errors: [] };

  for (const { rowNumber, ...payload } of rows) {
    try {
      const existing = await findExistingProduct(admin, payload);

      if (existing) {
        // El sku del producto existente no cambia; el margen personalizado se respeta.
        const { sku: _sku, ...fields } = payload;
        void _sku;
        const margin = Number(existing.margin_pct);
        const update = Number.isFinite(margin)
          ? { ...fields, sale_price: calculateSalePrice(payload.cost_price, margin) }
          : fields;
        const { error } = await admin.from("products").update(update).eq("id", existing.id);
        if (error) throw error;
        result.updated++;
      } else {
        const { error } = await admin.from("products").insert(payload);
        if (error) throw error;
        result.inserted++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      result.errors.push(`Fila ${rowNumber} (${payload.name}): ${message ?? "error desconocido"}`);
    }
  }

  return result;
}
