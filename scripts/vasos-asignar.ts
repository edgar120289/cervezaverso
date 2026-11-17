/**
 * Fase 0 del plan de fotos: respaldo y asignación automática del vaso de cada cerveza.
 *
 * Uso:
 *   npm run vasos -- --respaldo   # guarda respaldos/products_antes_fase0.json (id, name, style de TODOS)
 *   npm run vasos                 # --dry-run por defecto: muestra qué asignaría, no escribe
 *   npm run vasos -- --apply      # asigna SOLO activas, no retiradas y con vaso vacío (origen 'auto')
 *   npm run vasos -- --reporte    # conteo por vaso, sin asignar y 10 ejemplos al azar
 *
 * Nunca sobrescribe un vaso ya asignado (ni 'auto' ni 'manual'): el UPDATE exige `vaso is null`.
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assignVaso, vasoNombre, type VasoCode } from "../lib/vasos";

const BACKUP_FILE = path.join("respaldos", "products_antes_fase0.json");
const CONCURRENCY = 8;

type Row = { id: string; name: string; style: string; country: string; vaso: string | null; vaso_origen: string | null };

async function main() {
  const args = new Set(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (args.has("--respaldo")) {
    if (existsSync(BACKUP_FILE) && !args.has("--forzar")) {
      console.error(`Ya existe ${BACKUP_FILE}; no se sobrescribe (usa --forzar si de verdad quieres reemplazarlo).`);
      process.exit(1);
    }
    const { data, error } = await supabase.from("products").select("id, name, style").order("name").order("id");
    if (error) throw error;
    mkdirSync(path.dirname(BACKUP_FILE), { recursive: true });
    writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`Respaldo: ${data.length} productos en ${BACKUP_FILE}`);
    return;
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, style, country, vaso, vaso_origen")
    .eq("is_active", true)
    .eq("retirado", false)
    .order("name");
  if (error) throw error;
  const rows = data as Row[];

  if (args.has("--reporte")) {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.vaso ?? "(sin asignar)", (counts.get(row.vaso ?? "(sin asignar)") ?? 0) + 1);
    console.log(`Activas y no retiradas: ${rows.length}`);
    for (const [vaso, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${vaso}`);
    console.log(`Cambiadas a mano: ${rows.filter((row) => row.vaso_origen === "manual").length}`);
    console.log("\nSin asignar:");
    for (const row of rows.filter((row) => !row.vaso)) console.log(`  ${row.name} — ${row.style} (${row.country})`);
    console.log("\n10 ejemplos al azar:");
    const assigned = rows.filter((row) => row.vaso);
    for (let i = 0; i < 10 && assigned.length > 0; i++) {
      const [row] = assigned.splice(Math.floor(Math.random() * assigned.length), 1);
      console.log(`  ${row.name} — ${row.style} — ${row.vaso} (${vasoNombre(row.vaso)})`);
    }
    return;
  }

  const pending = rows.filter((row) => row.vaso === null);
  const plan = pending
    .map((row) => ({ row, vaso: assignVaso(row) }))
    .filter((item): item is { row: Row; vaso: VasoCode } => item.vaso !== null);

  console.log(`Activas y no retiradas: ${rows.length} · ya con vaso: ${rows.length - pending.length} · sin vaso: ${pending.length}`);
  console.log(`La regla asigna ${plan.length}; quedan sin asignar ${pending.length - plan.length}.`);

  if (!args.has("--apply")) {
    for (const { row, vaso } of plan) console.log(`  ${vaso.padEnd(24)} ${row.name} — ${row.style}`);
    for (const row of pending.filter((row) => assignVaso(row) === null)) {
      console.log(`  ${"(sin asignar)".padEnd(24)} ${row.name} — ${row.style} (${row.country})`);
    }
    console.log("--dry-run: no se escribió nada. Usa --apply para asignar.");
    return;
  }

  let done = 0;
  let failed = 0;
  for (let i = 0; i < plan.length; i += CONCURRENCY) {
    await Promise.all(
      plan.slice(i, i + CONCURRENCY).map(async ({ row, vaso }) => {
        // `vaso is null` en el UPDATE: si alguien lo asignó mientras tanto, no se pisa.
        const { data: updated, error: updateError } = await supabase
          .from("products")
          .update({ vaso, vaso_origen: "auto" })
          .eq("id", row.id)
          .is("vaso", null)
          .select("id");
        if (updateError) {
          failed++;
          console.error(`  Error en ${row.name}: ${updateError.message}`);
        } else if (updated.length > 0) done++;
      }),
    );
  }
  console.log(`Asignadas: ${done} · errores: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
