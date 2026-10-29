import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateSalePrice } from "@/lib/pricing";
import { insertNewProduct, type MonasterioRow } from "@/lib/monasterio";
import type { StockStatus } from "@/lib/types";

/**
 * Carga masiva en dos pasos: `planCatalogImport` calcula todo lo que cambiaría sin escribir
 * nada (la vista previa del panel) y `applyCatalogPlan` aplica ese mismo plan.
 *
 * Reglas:
 * - Retiradas (`retirado`): se ignoran por completo. Nunca se reactivan ni cambian precio o datos.
 * - Nuevas: entran inactivas y `pendiente` hasta que el admin les pone foto y cervecería y las activa.
 * - Pendientes: actualizan costo, precio y disponibilidad, pero la carga no las activa.
 * - País, estilo y ABV corregidos a mano no se sobrescriben: solo se llenan si están vacíos;
 *   si el archivo trae otro valor, se informa en la vista previa.
 * - Solo con el archivo de Monasterio: las cervezas de Monasterio que ya no vienen en la lista
 *   pasan a «Agotada» (no se borran ni se retiran).
 */

export const MONASTERIO = "monasterio";

export type CatalogFormat = "monasterio" | "plantilla";

export type ExistingProduct = {
  id: string;
  sku: string;
  name: string;
  volume_ml: number | null;
  country: string | null;
  style: string | null;
  abv: number | string | null;
  cost_price: number | string;
  sale_price: number | string;
  stock_status: StockStatus;
  is_active: boolean;
  retirado: boolean;
  pendiente: boolean;
  margin_pct: number | string | null;
  proveedor: string | null;
  brewery?: string | null;
};

export const EXISTING_PRODUCT_COLUMNS =
  "id, sku, name, volume_ml, country, style, abv, cost_price, sale_price, stock_status, is_active, retirado, pendiente, margin_pct, proveedor, brewery";

type InfoField = "country" | "style" | "abv";

export type PlannedNew = Omit<MonasterioRow, "sku" | "is_active"> & { brewery?: string };

/** Sin acentos, en minúsculas y solo letras y números separados por un espacio. */
const plain = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const GENERIC_BREWERY_WORDS = /\b(brewery|brewing|brewing company|company|co|brauerei|brouwerij|brasserie|birrificio|cerveceria|beer)\b/g;

/**
 * Cervecería de una cerveza nueva, deducida del catálogo (la lista de Monasterio no la trae):
 * 1) el nombre empieza con una cervecería conocida («MONKEY WAVES …» → Monkey Waves) o
 * 2) la primera palabra del nombre siempre ha sido de la misma cervecería en el catálogo («JABALÍ …» → Primus).
 * Si no hay certeza, queda vacía y la cerveza aparece en «Incompletas».
 */
export function breweryGuesser(existing: Pick<ExistingProduct, "name" | "brewery">[]): (name: string) => string | undefined {
  const known = new Map<string, string>();
  const byFirstWord = new Map<string, Set<string>>();
  for (const product of existing) {
    const brewery = product.brewery?.trim();
    if (!brewery) continue;
    const key = plain(brewery).replace(GENERIC_BREWERY_WORDS, " ").replace(/\s+/g, " ").trim();
    if (key.length >= 3 && !known.has(key)) known.set(key, brewery);
    const first = plain(product.name).split(" ")[0];
    if (first && first.length >= 3) byFirstWord.set(first, (byFirstWord.get(first) ?? new Set()).add(brewery));
  }
  const keys = [...known.keys()].sort((a, b) => b.length - a.length);
  return (name) => {
    const target = plain(name);
    const hit = keys.find((key) => target === key || target.startsWith(`${key} `));
    if (hit) return known.get(hit);
    const candidates = byFirstWord.get(target.split(" ")[0]);
    return candidates?.size === 1 ? [...candidates][0] : undefined;
  };
}

export type PlannedUpdate = {
  rowNumber: number;
  id: string;
  name: string;
  volume_ml: number;
  pendiente: boolean;
  /** Solo los campos que realmente cambian; vacío = sin cambios. */
  changes: Record<string, unknown>;
  price: { from: number; to: number };
  stock: { from: StockStatus; to: StockStatus };
  active: { from: boolean; to: boolean };
  info: { field: InfoField; current: string; file: string }[];
};

export type PlannedIgnored = { rowNumber: number; id: string; name: string; volume_ml: number };

export type PlannedMissing = { id: string; name: string; volume_ml: number | null; stockFrom: StockStatus };

export type CatalogPlan = {
  format: CatalogFormat;
  news: PlannedNew[];
  updates: PlannedUpdate[];
  ignored: PlannedIgnored[];
  missing: PlannedMissing[];
  /** Cervezas del archivo de Monasterio que aún no tienen proveedor: se marcan en una sola consulta. */
  tagProvider: string[];
  skipped: number;
  errors: string[];
  fingerprint: string;
};

export type ImportResult = {
  inserted: number;
  updated: number;
  unchanged: number;
  ignored: number;
  retired: number;
  markedOutOfStock: number;
  skipped: number;
  errors: string[];
};

const nameKey = (name: string, volume: number | null) =>
  `${name.normalize("NFC").trim().toLocaleLowerCase("es-MX")}|${volume ?? 0}`;

const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === "";

const sameText = (a: unknown, b: unknown) =>
  String(a ?? "").normalize("NFC").trim().toLocaleLowerCase("es-MX") ===
  String(b ?? "").normalize("NFC").trim().toLocaleLowerCase("es-MX");

/** Igual que `findExistingProduct`: primero por la clave heredada (sku), luego por nombre + volumen. */
function indexExisting(products: ExistingProduct[]) {
  const bySku = new Map<string, ExistingProduct>();
  const byName = new Map<string, ExistingProduct>();
  for (const product of products) {
    bySku.set(product.sku, product);
    const key = nameKey(product.name, product.volume_ml);
    if (!byName.has(key)) byName.set(key, product);
  }
  return (row: Pick<MonasterioRow, "sku" | "name" | "volume_ml">) =>
    bySku.get(row.sku) ?? byName.get(nameKey(row.name, row.volume_ml)) ?? null;
}

function planUpdate(row: MonasterioRow, existing: ExistingProduct): PlannedUpdate {
  const margin = Number(existing.margin_pct);
  const salePrice = !isBlank(existing.margin_pct) && Number.isFinite(margin)
    ? calculateSalePrice(row.cost_price, margin)
    : row.sale_price;

  // Las pendientes no se activan con la carga; el resto sigue la regla «agotada = inactiva».
  const activeTo = existing.pendiente ? existing.is_active : row.is_active;

  const target: Record<string, unknown> = {
    cost_price: row.cost_price,
    sale_price: salePrice,
    stock_status: row.stock_status,
    volume_ml: row.volume_ml,
    is_active: activeTo,
  };

  const info: PlannedUpdate["info"] = [];
  const fill = (field: InfoField, fileValue: string | number, empty: boolean, differs: boolean) => {
    if (empty) {
      if (!isBlank(fileValue) && !(field === "abv" && Number(fileValue) === 0)) target[field] = fileValue;
    } else if (differs && !isBlank(fileValue) && !(field === "abv" && Number(fileValue) === 0)) {
      info.push({ field, current: String(existing[field]), file: String(fileValue) });
    }
  };
  fill("country", row.country, isBlank(existing.country), !sameText(existing.country, row.country));
  fill("style", row.style, isBlank(existing.style), !sameText(existing.style, row.style));
  fill("abv", row.abv, isBlank(existing.abv) || Number(existing.abv) === 0, Math.abs(Number(existing.abv) - row.abv) > 0.01);

  const changes: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(target)) {
    const current = existing[field as keyof ExistingProduct];
    const equal = typeof value === "number" ? Number(current) === value : current === value;
    if (!equal) changes[field] = value;
  }

  return {
    rowNumber: row.rowNumber,
    id: existing.id,
    name: existing.name,
    volume_ml: row.volume_ml,
    pendiente: existing.pendiente,
    changes,
    price: { from: Number(existing.sale_price), to: salePrice },
    stock: { from: existing.stock_status, to: row.stock_status },
    active: { from: existing.is_active, to: activeTo },
    info,
  };
}

/** Cálculo puro (sin base de datos): lo usan la vista previa, la aplicación y las pruebas. */
export function buildCatalogPlan(
  rows: MonasterioRow[],
  existing: ExistingProduct[],
  format: CatalogFormat,
  skipped = 0,
  parseErrors: string[] = []
): CatalogPlan {
  const find = indexExisting(existing);
  const guessBrewery = breweryGuesser(existing);
  const news: PlannedNew[] = [];
  const updates = new Map<string, PlannedUpdate>();
  const ignored: PlannedIgnored[] = [];
  const errors = [...parseErrors];
  const seen = new Set<string>();
  const newKeys = new Set<string>();

  for (const row of rows) {
    const match = find(row);
    if (match) {
      seen.add(match.id);
      if (match.retirado) {
        ignored.push({ rowNumber: row.rowNumber, id: match.id, name: match.name, volume_ml: row.volume_ml });
        continue;
      }
      if (updates.has(match.id)) {
        errors.push(`Fila ${row.rowNumber} (${row.name}): repetida en el archivo; se usa la última.`);
      }
      updates.set(match.id, planUpdate(row, match));
      continue;
    }

    const key = nameKey(row.name, row.volume_ml);
    if (newKeys.has(key)) {
      errors.push(`Fila ${row.rowNumber} (${row.name}): repetida en el archivo; se omite.`);
      continue;
    }
    newKeys.add(key);
    const { sku: _sku, is_active: _active, ...fields } = row;
    void _sku;
    void _active;
    const brewery = guessBrewery(row.name);
    news.push(brewery ? { ...fields, brewery } : fields);
  }

  const missing: PlannedMissing[] =
    format === "monasterio"
      ? existing
          .filter((p) => p.proveedor === MONASTERIO && !p.retirado && !seen.has(p.id) && p.stock_status !== "out_of_stock")
          .map((p) => ({ id: p.id, name: p.name, volume_ml: p.volume_ml, stockFrom: p.stock_status }))
      : [];

  const updateList = [...updates.values()];
  const byId = new Map(existing.map((p) => [p.id, p]));
  const tagProvider =
    format === "monasterio" ? updateList.filter((u) => byId.get(u.id)?.proveedor !== MONASTERIO).map((u) => u.id) : [];
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        format,
        news: news.map((n) => [n.name, n.volume_ml, n.cost_price, n.stock_status]),
        updates: updateList.map((u) => [u.id, u.changes]),
        missing: missing.map((m) => m.id),
        tagProvider,
      })
    )
    .digest("hex");

  return { format, news, updates: updateList, ignored, missing, tagProvider, skipped, errors, fingerprint };
}

export async function fetchExistingProducts(client: SupabaseClient): Promise<ExistingProduct[]> {
  const pageSize = 1000;
  const all: ExistingProduct[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("products")
      .select(EXISTING_PRODUCT_COLUMNS)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...((data ?? []) as unknown as ExistingProduct[]));
    if (!data || data.length < pageSize) return all;
  }
}

export async function planCatalogImport(
  client: SupabaseClient,
  parsed: { rows: MonasterioRow[]; skipped: number; errors: string[]; format: CatalogFormat }
): Promise<CatalogPlan> {
  const existing = await fetchExistingProducts(client);
  return buildCatalogPlan(parsed.rows, existing, parsed.format, parsed.skipped, parsed.errors);
}

/** Las que la carga volvería a activar: en la vista previa se pueden marcar como retiradas. */
export const isReactivation = (u: PlannedUpdate) => !u.active.from && u.active.to;

/**
 * Aplica el plan. `retire` son ids de cervezas que se reactivarían y el admin decidió retirar:
 * quedan inactivas y retiradas, sin cambiar su precio ni sus datos.
 * Requiere un cliente con service_role.
 */
export async function applyCatalogPlan(
  admin: SupabaseClient,
  plan: CatalogPlan,
  retire: string[] = []
): Promise<ImportResult> {
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    ignored: plan.ignored.length,
    retired: 0,
    markedOutOfStock: 0,
    skipped: plan.skipped,
    errors: [...plan.errors],
  };
  const retireIds = new Set(retire);

  await runPool(plan.updates, UPDATE_CONCURRENCY, async (update) => {
    try {
      if (retireIds.has(update.id) && isReactivation(update)) {
        const { error } = await admin.from("products").update({ retirado: true, is_active: false }).eq("id", update.id);
        if (error) throw error;
        result.retired++;
        return;
      }
      if (Object.keys(update.changes).length === 0) {
        result.unchanged++;
        return;
      }
      const { error } = await admin.from("products").update(update.changes).eq("id", update.id);
      if (error) throw error;
      result.updated++;
    } catch (err) {
      result.errors.push(`Fila ${update.rowNumber} (${update.name}): ${errorMessage(err)}`);
    }
  });

  const tagIds = plan.tagProvider.filter((id) => !retireIds.has(id));
  for (let i = 0; i < tagIds.length; i += ID_CHUNK) {
    const { error } = await admin
      .from("products")
      .update({ proveedor: MONASTERIO })
      .in("id", tagIds.slice(i, i + ID_CHUNK));
    if (error) result.errors.push(`No se pudo registrar el proveedor: ${error.message}`);
  }

  for (const item of plan.news) {
    const { rowNumber, ...fields } = item;
    const error = await insertNewProduct(admin, {
      ...fields,
      is_active: false,
      pendiente: true,
      ...(plan.format === "monasterio" ? { proveedor: MONASTERIO } : {}),
    });
    if (error) result.errors.push(`Fila ${rowNumber} (${item.name}): ${error.message}`);
    else result.inserted++;
  }

  for (let i = 0; i < plan.missing.length; i += ID_CHUNK) {
    const chunk = plan.missing.slice(i, i + ID_CHUNK).map((m) => m.id);
    const { error } = await admin.from("products").update({ stock_status: "out_of_stock" }).in("id", chunk);
    if (error) result.errors.push(`No se pudieron marcar como agotadas las que ya no vienen en la lista: ${error.message}`);
    else result.markedOutOfStock += chunk.length;
  }

  return result;
}

/** Actualizaciones en paralelo (pocas a la vez) para no rebasar el tiempo máximo de la función. */
const UPDATE_CONCURRENCY = 8;
/** Tamaño de lote para `.in("id", …)`: evita URLs demasiado largas. */
const ID_CHUNK = 150;

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  });
  await Promise.all(lanes);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return (err as { message?: string })?.message ?? "error desconocido";
}
