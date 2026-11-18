/**
 * Portadas uniformes (botella o lata de frente, fondo blanco, 1200x1200, producto centrado al
 * ~85 % de alto, WebP 90). Herramienta local con su propio package.json: no entra a Vercel.
 *
 * Uso (desde tools/portadas, tras `npm install`; todo local hasta `--subir`; `--dir` cambia la
 * carpeta de trabajo):
 *   npm run portadas -- --respaldo                 # respaldos/portadas_antes_fase1.json (activas)
 *        [--solo a,b,c] [--salida respaldos/x.json] # …o solo esos SKU, en otro archivo
 *   npm run portadas -- --procesar [--solo a,b,c]  # cervezas sin procesar o en 'revisar'; NO toca la base
 *        [--todas]                                 # …o todas las activas
 *   npm run portadas -- --comparar                 # <dir>/comparacion.html (antes | después)
 *   npm run portadas -- --subir [--solo a,b,c]     # sube archivos NUEVOS y actualiza la portada
 *   npm run portadas -- --revertir                 # regresa image_urls[1] a portada_original
 *
 * Estados: 'normalizada' (foto buena o reemplazo oficial), 'nueva' (no tenía foto),
 * 'baja_res' (original de 350–599 px escalada con lanczos y enfoque suave) y 'revisar'
 * (se queda como estaba: menos de 350 px, sin foto o descartada a ojo en `buscar`).
 *
 * Reglas de reversibilidad:
 * - Nunca borra ni sobrescribe en Storage: sube `<sku>/portada-vN.webp` (+ `-480.webp`) con el
 *   primer N libre y `upsert: false`.
 * - Antes de cambiar una cerveza guarda su `image_url` en `portada_original` (solo la primera vez).
 * - Solo cambia el primer elemento de `image_urls` (el trigger copia la portada a `image_url`).
 *
 * Fotos de reemplazo (mín. 800 px de alto), descartes y ajustes por SKU: tools/portadas/fuentes.json.
 * Quitar el fondo usa @imgly/background-removal-node (en el package.json de esta carpeta, nunca
 * en el del sitio). Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el
 * .env.local de la raíz del proyecto.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, "..", "..");
const BACKUP_FILE = path.join(ROOT, "respaldos", "portadas_antes_fase1.json");
const SOURCES_FILE = path.join(HERE, "fuentes.json");
/** Iguales a PRODUCT_IMAGE_BUCKET y productThumbPath del sitio (lib/validation, lib/product-images). */
const PRODUCT_IMAGE_BUCKET = "product-images";
const productThumbPath = (objectPath: string) => objectPath.replace(/\.[a-z0-9]+$/i, "") + "-480.webp";

const SIZE = 1200;
/** Caja donde cabe el producto: 85 % del lienzo (mismo margen en todas). */
const BOX = Math.round(SIZE * 0.85);
const QUALITY = 90;
const THUMB = 480;
const THUMB_QUALITY = 82;
/** Desde este alto la foto se normaliza sin más; entre MIN_SCALED_HEIGHT y este, escalada ('baja_res'). */
const MIN_SOURCE_HEIGHT = 600;
const MIN_SCALED_HEIGHT = 350;
/** Una foto de reemplazo de la web debe medir al menos esto de alto. */
const MIN_REPLACEMENT_HEIGHT = 800;
const CONCURRENCY = 4;

type Row = {
  id: string;
  sku: string;
  name: string;
  image_url: string | null;
  image_urls: string[] | null;
  portada_estado: string | null;
};

type Estado = "normalizada" | "nueva" | "baja_res" | "revisar";
type Fondo = "transparente" | "blanco" | "fondo";

type Resultado = {
  sku: string;
  name: string;
  estado: Estado;
  motivo?: string;
  fondo?: Fondo;
  fuente?: string;
  original?: { width: number; height: number };
  /** Cuánto se amplió el producto para llenar la caja (> 1 = escalado). */
  escala?: number;
};

type Fuentes = {
  /** sku → motivo: la foto actual no sirve (vaso servido, varias botellas, borrosa al escalar…). */
  buscar: Record<string, string>;
  /** sku → foto de reemplazo encontrada en la web y de dónde salió. */
  fuentes: Record<string, { url: string; origen: string }>;
  /**
   * sku → ajustes de recorte, decididos al revisar la hoja de comparación:
   * - "blanco": la foto es de fondo blanco aunque el producto toque el borde (forzar ese recorte).
   * - "completa": no recortar; la foto ya es solo el producto sobre blanco (latas con partes blancas).
   * - "principal": quedarse solo con el objeto más grande (quita sellos como «6 Pack» o «12 cans»).
   */
  ajustes: Record<string, Ajuste[]>;
};

type Ajuste = "blanco" | "completa" | "principal";

function readSources(): Fuentes {
  if (!existsSync(SOURCES_FILE)) return { buscar: {}, fuentes: {}, ajustes: {} };
  const data = JSON.parse(readFileSync(SOURCES_FILE, "utf8")) as Partial<Fuentes>;
  return { buscar: data.buscar ?? {}, fuentes: data.fuentes ?? {}, ajustes: data.ajustes ?? {} };
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

// ---------------------------------------------------------------------------------------------
// Procesamiento de imagen
// ---------------------------------------------------------------------------------------------

type Raw = { data: Buffer; width: number; height: number };

async function toRaw(input: Buffer): Promise<Raw> {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Distancia al blanco puro (0 = blanco). */
function whiteDistance(data: Buffer, i: number): number {
  return 255 - Math.min(data[i], data[i + 1], data[i + 2]);
}

function classify(raw: Raw): Fondo {
  const { data, width, height } = raw;
  // Ya recortada: aunque el producto llene el borde, tiene zonas transparentes (esquinas).
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 128) clear++;
  if (clear / (width * height) > 0.01) return "transparente";

  const band = Math.max(2, Math.round(Math.min(width, height) * 0.02));
  let border = 0;
  let transparent = 0;
  let white = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= band && x < width - band && y >= band && y < height - band) continue;
      const i = (y * width + x) * 4;
      border++;
      if (data[i + 3] < 128) transparent++;
      else if (whiteDistance(data, i) <= 22 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) <= 14) white++;
    }
  }
  if (transparent / border > 0.5) return "transparente";
  if ((white + transparent) / border > 0.9) return "blanco";
  return "fondo";
}

/** Fondo blanco: los píxeles casi blancos se vuelven transparentes con borde suave. */
function alphaFromWhite(raw: Raw): Raw {
  const out = Buffer.from(raw.data);
  for (let i = 0; i < out.length; i += 4) {
    const distance = whiteDistance(out, i);
    const soft = Math.max(0, Math.min(1, (distance - 8) / 16));
    out[i + 3] = Math.round(out[i + 3] * soft);
  }
  return { ...raw, data: out };
}

/**
 * Fondo blanco: manda la máscara del modelo (deja fuera sombras y gris del fondo y conserva los
 * tonos claros de la etiqueta). Además se rescatan los píxeles con color u oscuros pegados al
 * producto que el modelo hubiera dejado fuera; lo blanco que omita no se nota sobre blanco.
 * Si el modelo apenas reconoció el producto, se usa el recorte por blancura.
 */
async function whiteBackgroundCutout(source: Raw, model: Raw): Promise<Raw> {
  const byWhite = alphaFromWhite(source);
  if (model.width !== source.width || model.height !== source.height) return byWhite;
  const pixels = source.width * source.height;
  const alpha = Buffer.alloc(pixels);
  let modelArea = 0;
  let whiteArea = 0;
  for (let p = 0; p < pixels; p++) {
    alpha[p] = model.data[p * 4 + 3];
    if (alpha[p] > 128) modelArea++;
    if (byWhite.data[p * 4 + 3] > 128) whiteArea++;
  }
  if (modelArea < whiteArea * 0.5) return byWhite;
  const near = await sharp(alpha, { raw: { width: source.width, height: source.height, channels: 1 } })
    .blur(Math.max(2, Math.round(Math.max(source.width, source.height) * 0.006)))
    .raw()
    .toBuffer();
  const out = Buffer.from(source.data);
  for (let p = 0; p < pixels; p++) {
    const i = p * 4;
    let value = alpha[p];
    if (near[p] > 24 && value < 255) {
      const max = Math.max(out[i], out[i + 1], out[i + 2]);
      const min = Math.min(out[i], out[i + 1], out[i + 2]);
      if (max - min > 32 || min < 90) value = Math.max(value, byWhite.data[i + 3]);
    }
    out[i + 3] = value;
  }
  return { ...source, data: out };
}

/** Limpia el alfa: quita el polvo semitransparente que deja el recorte. */
function cleanAlpha(raw: Raw, floor: number): Raw {
  const out = Buffer.from(raw.data);
  for (let i = 3; i < out.length; i += 4) if (out[i] < floor) out[i] = 0;
  return { ...raw, data: out };
}

/** Caja del producto: filas y columnas con suficientes píxeles opacos (ignora ruido suelto). */
function boundingBox(raw: Raw): { left: number; top: number; width: number; height: number } | null {
  const { data, width, height } = raw;
  const rows = new Uint32Array(height);
  const cols = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 40) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const minRow = Math.max(2, Math.round(width * 0.004));
  const minCol = Math.max(2, Math.round(height * 0.004));
  let top = 0;
  while (top < height && rows[top] < minRow) top++;
  let bottom = height - 1;
  while (bottom > top && rows[bottom] < minRow) bottom--;
  let left = 0;
  while (left < width && cols[left] < minCol) left++;
  let right = width - 1;
  while (right > left && cols[right] < minCol) right--;
  if (top >= bottom || left >= right) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Quitar el fondo corre en otro proceso (quitar-fondo.mjs): la librería trae su
 * propio sharp/libvips y, cargado junto al del proyecto en el mismo proceso, Node se cae.
 */
let worker: { send: (input: string, output: string) => Promise<void>; stop: () => void } | null = null;

function backgroundWorker() {
  if (worker) return worker;
  if (!existsSync(path.join(HERE, "node_modules", "@imgly", "background-removal-node"))) {
    throw new Error("Falta @imgly/background-removal-node: corre npm install en tools/portadas");
  }
  const child = spawn(process.execPath, [path.join(HERE, "quitar-fondo.mjs")], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  const pending = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
  let nextId = 0;
  createInterface({ input: child.stdout }).on("line", (line) => {
    if (!line.startsWith("{")) return;
    const { id, error } = JSON.parse(line) as { id: number; error?: string };
    const job = pending.get(id);
    pending.delete(id);
    if (error) job?.reject(new Error(error));
    else job?.resolve();
  });
  child.on("exit", (code) => {
    for (const job of pending.values()) job.reject(new Error(`El proceso de quitar fondo terminó (${code}).`));
    pending.clear();
    worker = null;
  });
  worker = {
    send: (input, output) =>
      new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        child.stdin.write(JSON.stringify({ id, input, output }) + "\n");
      }),
    stop: () => child.stdin.end(),
  };
  return worker;
}

async function removeBackground(input: Buffer): Promise<Buffer> {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "portada-"));
  try {
    const source = path.join(tmp, "entrada.png");
    const target = path.join(tmp, "salida.png");
    // Se le pasa PNG ya girado según EXIF.
    writeFileSync(source, await sharp(input).rotate().png().toBuffer());
    await backgroundWorker().send(source, target);
    return readFileSync(target);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Deja solo el objeto más grande: borra el alfa fuera de la caja de la mayor mancha opaca
 * (sellos o insignias sueltos junto a la botella).
 */
function keepMainObject(raw: Raw): Raw {
  const { data, width, height } = raw;
  const labels = new Int32Array(width * height);
  const stack: number[] = [];
  let best = { size: 0, left: 0, top: 0, right: width - 1, bottom: height - 1 };
  let label = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 200) continue;
    label++;
    const blob = { size: 0, left: width, top: height, right: 0, bottom: 0 };
    labels[start] = label;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      const y = (p - x) / width;
      blob.size++;
      blob.left = Math.min(blob.left, x);
      blob.right = Math.max(blob.right, x);
      blob.top = Math.min(blob.top, y);
      blob.bottom = Math.max(blob.bottom, y);
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
        if (q >= 0 && !labels[q] && data[q * 4 + 3] > 200) {
          labels[q] = label;
          stack.push(q);
        }
      }
    }
    if (blob.size > best.size) best = blob;
  }
  const pad = 4;
  const out = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < best.left - pad || x > best.right + pad || y < best.top - pad || y > best.bottom + pad) out[(y * width + x) * 4 + 3] = 0;
    }
  }
  return { ...raw, data: out };
}

export async function normalizeCover(
  input: Buffer,
  ajustes: Ajuste[] = [],
): Promise<{ full: Buffer; thumb: Buffer; fondo: Fondo; width: number; height: number; escala: number }> {
  const source = await toRaw(input);
  const fondo = ajustes.includes("blanco") || ajustes.includes("completa") ? "blanco" : classify(source);
  let cutout: Raw;
  if (ajustes.includes("completa")) {
    // Sin recorte: solo se quita el margen blanco; el fondo blanco se funde con el lienzo.
    cutout = await toRaw(await sharp(input).rotate().flatten({ background: "#ffffff" }).trim({ background: "#ffffff", threshold: 20 }).png().toBuffer());
  } else if (fondo === "transparente") cutout = cleanAlpha(source, 12);
  else if (fondo === "blanco") cutout = cleanAlpha(await whiteBackgroundCutout(source, await toRaw(await removeBackground(input))), 24);
  else cutout = cleanAlpha(await toRaw(await removeBackground(input)), 24);
  if (ajustes.includes("principal")) cutout = keepMainObject(cutout);

  const box = boundingBox(cutout);
  if (!box) throw new Error("No se encontró el producto en la imagen.");

  const cropped = await sharp(cutout.data, { raw: { width: cutout.width, height: cutout.height, channels: 4 } })
    .extract(box)
    .resize({ width: BOX, height: BOX, fit: "inside", kernel: "lanczos3" })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((SIZE - cropped.info.width) / 2);
  const top = Math.round((SIZE - cropped.info.height) / 2);
  const canvas = sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#ffffff" } })
    .composite([{ input: cropped.data, left, top }])
    .flatten({ background: "#ffffff" });
  const escala = Math.round((cropped.info.height / box.height) * 100) / 100;
  let flat = await canvas.png().toBuffer();
  // Ampliada: enfoque suave para compensar el lanczos, sin inventar detalle.
  if (escala > 1.05) flat = await sharp(flat).sharpen({ sigma: 0.7, m1: 0.5, m2: 1 }).png().toBuffer();
  const full = await sharp(flat).webp({ quality: QUALITY }).toBuffer();
  const thumb = await sharp(flat).resize(THUMB, THUMB).webp({ quality: THUMB_QUALITY }).toBuffer();
  return { full, thumb, fondo, width: source.width, height: source.height, escala };
}

// ---------------------------------------------------------------------------------------------
// Base de datos y Storage
// ---------------------------------------------------------------------------------------------

function client(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function activeRows(supabase: SupabaseClient): Promise<Row[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, image_url, image_urls, portada_estado")
    .eq("is_active", true)
    .eq("retirado", false)
    .order("name");
  if (error) throw error;
  return data as Row[];
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (portadas)" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} al descargar ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function pool<T>(items: T[], worker: (item: T) => Promise<void>, size = CONCURRENCY) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await worker(items[next++]);
    }),
  );
}

// ---------------------------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------------------------

/** Con `--solo`, respalda solo esos SKU (activos o no); `--salida` cambia el archivo. */
async function backup(supabase: SupabaseClient, only: Set<string> | null) {
  const salida = argValue("--salida");
  const file = salida ? path.resolve(ROOT, salida) : BACKUP_FILE;
  if (existsSync(file) && !process.argv.includes("--forzar")) {
    console.error(`Ya existe ${file}; no se sobrescribe (usa --forzar si de verdad quieres reemplazarlo).`);
    process.exit(1);
  }
  let query = supabase.from("products").select("id, sku, name, image_url, image_urls");
  query = only ? query.in("sku", [...only]) : query.eq("is_active", true);
  const { data, error } = await query.order("name").order("id");
  if (error) throw error;
  if (only && data.length !== only.size) {
    const found = new Set(data.map((row) => row.sku));
    console.error(`No se encontraron: ${[...only].filter((sku) => !found.has(sku)).join(", ")}`);
    process.exit(1);
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Respaldo: ${data.length} cervezas en ${file}`);
}

function resultsFile(dir: string) {
  return path.join(dir, "resultados.json");
}

function readResults(dir: string): Record<string, Resultado> {
  return existsSync(resultsFile(dir)) ? JSON.parse(readFileSync(resultsFile(dir), "utf8")) : {};
}

async function processAll(supabase: SupabaseClient, dir: string, only: Set<string> | null, all: boolean) {
  const { buscar, fuentes, ajustes } = readSources();
  // Por defecto, solo lo pendiente: cervezas nuevas (sin estado) y las que siguen en 'revisar'.
  const rows = (await activeRows(supabase)).filter((row) =>
    only ? only.has(row.sku) : all || !row.portada_estado || row.portada_estado === "revisar",
  );
  mkdirSync(path.join(dir, "antes"), { recursive: true });
  mkdirSync(path.join(dir, "despues"), { recursive: true });
  const results = readResults(dir);
  let done = 0;

  await pool(rows, async (row) => {
    const fuente = fuentes[row.sku];
    const sourceUrl = fuente?.url ?? row.image_url;
    const base: Resultado = { sku: row.sku, name: row.name, estado: "revisar" };
    try {
      if (!sourceUrl) {
        results[row.sku] = { ...base, motivo: "Sin foto y sin fuente encontrada" };
        return;
      }
      if (!fuente && buscar[row.sku]) {
        results[row.sku] = { ...base, motivo: buscar[row.sku], fuente: row.image_url ?? undefined };
        return;
      }
      const input = sourceUrl.startsWith("http") ? await download(sourceUrl) : readFileSync(sourceUrl);
      writeFileSync(path.join(dir, "antes", `${row.sku}.png`), await sharp(input).rotate().png().toBuffer());
      const meta = await sharp(input).rotate().metadata();
      const original = { width: meta.width ?? 0, height: meta.height ?? 0 };
      // EXIF puede girar la foto: el alto real es el lado vertical después de rotar.
      const realHeight = (meta.orientation ?? 1) >= 5 ? original.width : original.height;
      if (fuente && realHeight < MIN_REPLACEMENT_HEIGHT) {
        results[row.sku] = { ...base, motivo: `Reemplazo de ${realHeight} px de alto (mín. ${MIN_REPLACEMENT_HEIGHT})`, original, fuente: sourceUrl };
        return;
      }
      if (realHeight < MIN_SCALED_HEIGHT) {
        results[row.sku] = { ...base, motivo: `Original de ${realHeight} px de alto`, original, fuente: sourceUrl };
        return;
      }
      const { full, thumb, fondo, escala } = await normalizeCover(input, ajustes[row.sku]);
      writeFileSync(path.join(dir, "despues", `${row.sku}.webp`), full);
      writeFileSync(path.join(dir, "despues", `${row.sku}-480.webp`), thumb);
      const estado: Estado = fuente
        ? row.image_url ? "normalizada" : "nueva"
        : realHeight < MIN_SOURCE_HEIGHT ? "baja_res" : "normalizada";
      results[row.sku] = { ...base, estado, fondo, original, escala, fuente: sourceUrl };
    } catch (error) {
      results[row.sku] = { ...base, motivo: `Error: ${(error as Error).message}`, fuente: sourceUrl ?? undefined };
    } finally {
      done++;
      if (done % 10 === 0 || done === rows.length) console.log(`  ${done}/${rows.length}`);
      writeFileSync(resultsFile(dir), JSON.stringify(results, null, 2));
    }
  });

  const values = rows.map((row) => results[row.sku]);
  const count = (estado: Estado) => values.filter((value) => value?.estado === estado).length;
  console.log(
    `Procesadas ${rows.length}: normalizadas ${count("normalizada")}, nuevas ${count("nueva")}, baja_res ${count("baja_res")}, revisar ${count("revisar")}`,
  );
  console.log(`Resultados en ${resultsFile(dir)}. Nada se escribió en la base ni en Storage.`);
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);
}

function compare(dir: string, only: Set<string> | null) {
  const results = Object.values(readResults(dir)).filter((result) => !only || only.has(result.sku));
  const rows = results
    .sort((a, b) => a.estado.localeCompare(b.estado) || a.name.localeCompare(b.name))
    .map((result) => {
      const before = existsSync(path.join(dir, "antes", `${result.sku}.png`))
        ? `<img src="antes/${encodeURIComponent(result.sku)}.png" alt="">`
        : `<div class="vacio">Sin foto</div>`;
      const after =
        result.estado !== "revisar"
          ? `<img src="despues/${encodeURIComponent(result.sku)}.webp" alt="">`
          : `<div class="vacio">${escapeHtml(result.motivo ?? "Revisar")}</div>`;
      const detail = [result.estado, result.fondo, result.original && `${result.original.width}×${result.original.height}`, result.escala && `×${result.escala}`]
        .filter(Boolean)
        .join(" · ");
      return `<figure><figcaption><b>${escapeHtml(result.name)}</b><br>${escapeHtml(detail)}</figcaption><div class="par"><div class="antes">${before}</div><div class="despues">${after}</div></div></figure>`;
    })
    .join("\n");
  const html = `<!doctype html><html lang="es-MX"><meta charset="utf-8"><title>Portadas · antes y después</title>
<style>
body{font-family:system-ui,sans-serif;background:#e9ebee;margin:0;padding:16px;color:#111}
h1{font-size:20px;margin:0 0 12px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
figure{margin:0;background:#fff;border-radius:16px;padding:10px}
figcaption{font-size:12px;line-height:1.35;margin-bottom:8px;min-height:32px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.antes,.despues{aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px}
.antes{background:repeating-conic-gradient(#ddd 0 25%,#f6f6f6 0 50%) 0 0/16px 16px}
.despues{outline:1px solid #ccc}
img{width:100%;height:100%;object-fit:contain;display:block}
.vacio{font-size:12px;color:#a33;text-align:center;padding:8px}
</style><h1>Portadas · antes | después (${results.length})</h1><main>${rows}</main></html>`;
  const file = path.join(dir, "comparacion.html");
  writeFileSync(file, html, "utf8");
  console.log(`Hoja de comparación: ${file}`);
}

/**
 * Versión a usar en `<sku>/portada-vN.webp`. Si la última versión subida es idéntica (mismo
 * tamaño) a la local —una corrida anterior la subió y falló al guardar en la base—, se reutiliza;
 * si no, la primera libre. Nunca se sobrescribe un archivo existente.
 */
async function coverVersion(supabase: SupabaseClient, sku: string, size: number): Promise<{ version: number; uploaded: Set<string> }> {
  const { data, error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).list(sku, { limit: 1000 });
  if (error) throw error;
  const files = data ?? [];
  const uploaded = new Set(files.map((file) => file.name));
  const versions = files
    .map((file) => ({ version: Number(/^portada-v(\d+)\.webp$/.exec(file.name)?.[1] ?? 0), size: Number(file.metadata?.size ?? -1) }))
    .filter((file) => file.version > 0)
    .sort((a, b) => b.version - a.version);
  if (versions[0]?.size === size) return { version: versions[0].version, uploaded };
  let version = 1;
  while (uploaded.has(`portada-v${version}.webp`)) version++;
  return { version, uploaded };
}

async function withRetry<T>(task: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

async function upload(supabase: SupabaseClient, dir: string, only: Set<string> | null) {
  const results = readResults(dir);
  const rows = (await activeRows(supabase)).filter((row) => results[row.sku] && (!only || only.has(row.sku)));
  let changed = 0;
  let marked = 0;
  let failed = 0;

  let skipped = 0;
  await pool(rows, async (row) => {
    const result = results[row.sku];
    try {
      if (result.estado === "revisar") {
        if (row.portada_estado === "revisar") return void skipped++;
        // Solo se marca: la foto actual se queda como está.
        const { error } = await withRetry(async () => {
          const response = await supabase.from("products").update({ portada_estado: "revisar" }).eq("id", row.id);
          if (response.error) throw response.error;
          return response;
        });
        if (error) throw error;
        marked++;
        return;
      }
      // Ya aplicada en una corrida anterior: no se vuelve a subir.
      if (row.portada_estado === result.estado && /\/portada-v\d+\.webp$/.test(row.image_url ?? "")) return void skipped++;
      const full = readFileSync(path.join(dir, "despues", `${row.sku}.webp`));
      const { version, uploaded } = await withRetry(() => coverVersion(supabase, row.sku, full.length));
      const objectPath = `${row.sku}/portada-v${version}.webp`;
      const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
      for (const [file, target] of [
        [`${row.sku}.webp`, objectPath],
        [`${row.sku}-480.webp`, productThumbPath(objectPath)],
      ] as const) {
        if (uploaded.has(target.slice(row.sku.length + 1))) continue;
        await withRetry(async () => {
          const { error } = await bucket.upload(target, readFileSync(path.join(dir, "despues", file)), {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
          if (error) throw error;
        });
      }
      const url = bucket.getPublicUrl(objectPath).data.publicUrl;
      const rest = (row.image_urls ?? []).slice(1);
      const update: Record<string, unknown> = {
        image_urls: [url, ...rest],
        portada_estado: result.estado,
      };
      // Solo la primera vez: si ya tenía portada nueva, `portada_original` conserva la de antes de la fase.
      if (!row.portada_estado || row.portada_estado === "revisar") update.portada_original = row.image_url;
      const data = await withRetry(async () => {
        let query = supabase.from("products").update(update).eq("id", row.id);
        query = row.image_url ? query.eq("image_url", row.image_url) : query.is("image_url", null);
        const response = await query.select("id");
        if (response.error) throw response.error;
        return response.data;
      });
      if (!data.length) throw new Error("La portada cambió mientras tanto; no se tocó.");
      changed++;
    } catch (error) {
      failed++;
      console.error(`  Error en ${row.sku}: ${(error as Error).message}`);
    }
  }, 2);
  console.log(`Portadas nuevas: ${changed} · marcadas 'revisar': ${marked} · ya aplicadas: ${skipped} · errores: ${failed}`);
  if (failed > 0) process.exit(1);
}

async function revert(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, image_url, image_urls, portada_original, portada_estado")
    .in("portada_estado", ["normalizada", "nueva", "baja_res", "revisar"]);
  if (error) throw error;
  let reverted = 0;
  let failed = 0;
  for (const row of data as (Row & { portada_original: string | null })[]) {
    const current = row.image_urls ?? [];
    const isNewCover = /\/portada-v\d+\.webp$/.test(current[0] ?? "");
    const rest = current.slice(1);
    const update: Record<string, unknown> = { portada_estado: null };
    if (isNewCover) update.image_urls = row.portada_original ? [row.portada_original, ...rest] : rest;
    const { error: updateError } = await supabase.from("products").update(update).eq("id", row.id);
    if (updateError) {
      failed++;
      console.error(`  Error en ${row.sku}: ${updateError.message}`);
    } else if (isNewCover) reverted++;
  }
  console.log(`Portadas regresadas a la original: ${reverted} · errores: ${failed}`);
  console.log("Los archivos portada-v*.webp quedan en Storage (no se borra nada).");
  if (failed > 0) process.exit(1);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dir = argValue("--dir") ?? path.join(os.tmpdir(), "cervezaverso-portadas");
  const soloArg = argValue("--solo");
  const only = soloArg ? new Set(soloArg.split(",").map((sku) => sku.trim()).filter(Boolean)) : null;

  if (args.has("--comparar")) return compare(dir, only);
  const supabase = client();
  if (args.has("--respaldo")) return backup(supabase, only);
  if (args.has("--procesar")) {
    await processAll(supabase, dir, only, args.has("--todas"));
    worker?.stop();
    return;
  }
  if (args.has("--subir")) return upload(supabase, dir, only);
  if (args.has("--revertir")) return revert(supabase);
  console.log("Indica --respaldo, --procesar, --comparar, --subir o --revertir (ver el encabezado del script).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
