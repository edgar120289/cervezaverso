/**
 * Ingestor de consola para "LISTA MONASTERIO" (MASTER PROMPT V2 · Bloque 2.2).
 *
 * Uso:
 *   npm run import:monasterio -- ruta/al/archivo.xlsx           # importa a Supabase
 *   npm run import:monasterio -- ruta/al/archivo.xlsx --dry-run # sólo muestra lo que haría
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 * (salvo con --dry-run). La regla de precio es la misma que usa el panel:
 * Math.floor((costo * 1.5) / 5) * 5.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { MonasterioFormatError, parseMonasterio, upsertMonasterio } from "@/lib/monasterio";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.find((arg) => !arg.startsWith("--"));

  if (!filePath) {
    console.error("Uso: npm run import:monasterio -- <archivo.xlsx> [--dry-run]");
    process.exit(1);
  }

  const buffer = await readFile(filePath);
  const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const { rows, skipped } = await parseMonasterio(data);

  console.log(`Leídas ${rows.length} cervezas (${skipped} filas vacías omitidas).`);

  if (dryRun) {
    console.table(
      rows.map(({ name, country, style, cost_price, sale_price, stock_status }) => ({
        cerveza: name,
        pais: country,
        estilo: style,
        costo: cost_price,
        precio_venta: sale_price,
        stock: stock_status,
      }))
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const result = await upsertMonasterio(admin, rows, skipped);

  console.log(`✅ ${result.inserted} nuevas · 🔄 ${result.updated} actualizadas · ⏭️ ${result.skipped} omitidas`);
  if (result.errors.length > 0) {
    console.error(`${result.errors.length} errores:\n${result.errors.join("\n")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof MonasterioFormatError ? err.message : err);
  process.exit(1);
});
