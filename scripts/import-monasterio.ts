/**
 * Ingestor de consola para "LISTA MONASTERIO" (MASTER PROMPT V2 · Bloque 2.2).
 *
 * Uso:
 *   npm run import:monasterio -- ruta/al/archivo.xlsx --dry-run # vista previa: no escribe nada
 *   npm run import:monasterio -- ruta/al/archivo.xlsx           # aplica los cambios
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local (también en
 * --dry-run, porque la vista previa compara contra el catálogo actual). Mismas reglas que el
 * panel (`lib/catalog-plan.ts`): retiradas ignoradas, nuevas como pendientes y precio con el
 * margen de 30 % (costo / 0.70) o el margen personalizado del producto.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { applyCatalogPlan, isReactivation, planCatalogImport } from "@/lib/catalog-plan";
import { MonasterioFormatError, parseMonasterio } from "@/lib/monasterio";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.find((arg) => !arg.startsWith("--"));

  if (!filePath) {
    console.error("Uso: npm run import:monasterio -- <archivo.xlsx> [--dry-run]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }

  const buffer = await readFile(filePath);
  const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const parsed = await parseMonasterio(data);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const plan = await planCatalogImport(admin, { ...parsed, errors: [], format: "monasterio" });

  const changed = plan.updates.filter((u) => Object.keys(u.changes).length > 0);
  console.log(`Leídas ${parsed.rows.length} cervezas (${parsed.skipped} filas vacías omitidas).`);
  console.log(
    [
      `Nuevas (entran pendientes): ${plan.news.length}`,
      `Con cambios: ${changed.length}`,
      `Precio sube: ${changed.filter((u) => u.price.to > u.price.from).length}`,
      `Precio baja: ${changed.filter((u) => u.price.to < u.price.from).length}`,
      `Se reactivarían: ${plan.updates.filter(isReactivation).length}`,
      `Ignoradas por retiradas: ${plan.ignored.length}`,
      `Ya no vienen en la lista (pasan a agotadas): ${plan.missing.length}`,
    ].join("\n")
  );

  if (dryRun) return;

  const result = await applyCatalogPlan(admin, plan);
  console.log(
    `✅ ${result.inserted} nuevas · 🔄 ${result.updated} actualizadas · ${result.unchanged} sin cambios · ` +
      `${result.ignored} retiradas ignoradas · ${result.markedOutOfStock} agotadas`
  );
  if (result.errors.length > 0) {
    console.error(`${result.errors.length} avisos:\n${result.errors.join("\n")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof MonasterioFormatError ? err.message : err);
  process.exit(1);
});
