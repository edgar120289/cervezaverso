/**
 * Genera y sube la miniatura (480 px, WebP) de las fotos de producto que aún no la tienen:
 * `<carpeta>/<nombre>.<ext>` → `<carpeta>/<nombre>-480.webp` en el bucket product-images.
 * Nunca toca ni reemplaza las fotos originales ni la base de datos.
 *
 * Uso:
 *   npm run miniaturas:productos             # --dry-run por defecto: solo lista y cuenta
 *   npm run miniaturas:productos -- --apply  # descarga, convierte y sube las faltantes
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local (también en
 * --dry-run, porque lista el bucket real).
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { isProductThumbPath, PRODUCT_IMAGE_QUALITY, PRODUCT_THUMB_SIZE, productThumbPath } from "../lib/product-images";

const BUCKET = "product-images";
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif)$/i;
const PAGE_SIZE = 1000;
const CONCURRENCY = 6;

type StoredFile = { path: string; size: number };

async function main() {
  const apply = process.argv.includes("--apply");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const storage = supabase.storage.from(BUCKET);

  // Cada producto tiene su carpeta (el SKU); se listan las carpetas y luego sus archivos.
  const folders: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await storage.list("", { limit: PAGE_SIZE, offset });
    if (error) throw error;
    folders.push(...data.filter((entry) => entry.id === null).map((entry) => entry.name));
    if (data.length < PAGE_SIZE) break;
  }

  const files: StoredFile[] = [];
  for (const folder of folders) {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await storage.list(folder, { limit: PAGE_SIZE, offset });
      if (error) throw error;
      for (const entry of data) {
        if (entry.id !== null) files.push({ path: `${folder}/${entry.name}`, size: Number(entry.metadata?.size ?? 0) });
      }
      if (data.length < PAGE_SIZE) break;
    }
  }

  const existing = new Set(files.map((file) => file.path));
  const originals = files.filter((file) => IMAGE_EXTENSION.test(file.path) && !isProductThumbPath(file.path));
  const pending = originals.filter((file) => !existing.has(productThumbPath(file.path)));
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

  console.log(`Carpetas: ${folders.length} · archivos: ${files.length} · fotos originales: ${originals.length}`);
  console.log(`Con miniatura: ${originals.length - pending.length} · sin miniatura: ${pending.length}`);
  console.log(`Peso de las originales sin miniatura: ${kb(pending.reduce((sum, file) => sum + file.size, 0))}`);

  if (!apply) {
    console.log("--dry-run: no se subió nada. Usa --apply para generar y subir las miniaturas.");
    return;
  }

  let done = 0;
  let failed = 0;
  let thumbBytes = 0;
  const queue = [...pending];

  async function worker() {
    for (let file = queue.shift(); file; file = queue.shift()) {
      try {
        const { data, error } = await storage.download(file.path);
        if (error) throw error;
        const thumb = await sharp(Buffer.from(await data.arrayBuffer()))
          .rotate()
          .resize({ width: PRODUCT_THUMB_SIZE, height: PRODUCT_THUMB_SIZE, fit: "inside", withoutEnlargement: true })
          .webp({ quality: Math.round(PRODUCT_IMAGE_QUALITY * 100) })
          .toBuffer();
        // upsert: false → si la miniatura ya existe (otra corrida), no se pisa.
        const { error: uploadError } = await storage.upload(productThumbPath(file.path), thumb, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        thumbBytes += thumb.length;
        done += 1;
      } catch (err) {
        failed += 1;
        console.error(`✗ ${file.path}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Subidas: ${done} (${kb(thumbBytes)}) · fallidas: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
