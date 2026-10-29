/**
 * Pruebas de las reglas de la carga masiva (sin base de datos).
 * Uso: npx tsx scripts/test-catalog-plan.ts
 */
import assert from "node:assert/strict";
import { breweryGuesser, buildCatalogPlan, isReactivation, type ExistingProduct } from "@/lib/catalog-plan";
import type { MonasterioRow } from "@/lib/monasterio";

const base: Omit<ExistingProduct, "id" | "sku" | "name"> = {
  volume_ml: 330,
  country: "BÉLGICA",
  style: "Tripel",
  abv: 8,
  cost_price: 65,
  sale_price: 100,
  stock_status: "in_stock",
  is_active: true,
  retirado: false,
  pendiente: false,
  margin_pct: 35,
  proveedor: null,
};

const existing: ExistingProduct[] = [
  { ...base, id: "a", sku: "belgica-retirada-330", name: "RETIRADA", is_active: false, retirado: true },
  { ...base, id: "b", sku: "belgica-pendiente-330", name: "PENDIENTE", is_active: false, pendiente: true, stock_status: "out_of_stock" },
  { ...base, id: "c", sku: "belgica-margen-330", name: "MARGEN", margin_pct: 50, sale_price: 130 },
  { ...base, id: "d", sku: "belgica-inactiva-330", name: "INACTIVA", is_active: false, stock_status: "out_of_stock" },
  { ...base, id: "e", sku: "belgica-corregida-330", name: "CORREGIDA", country: "Bélgica", style: "Quadrupel" },
  { ...base, id: "f", sku: "belgica-vieja-330", name: "VIEJA", proveedor: "monasterio" },
  { ...base, id: "g", sku: "mexico-manual-355", name: "MANUAL", proveedor: null, volume_ml: 355 },
  { ...base, id: "h", sku: "belgica-vacia-330", name: "VACIA", style: "", abv: 0 },
];

const row = (name: string, overrides: Partial<MonasterioRow> = {}): MonasterioRow => ({
  rowNumber: 12,
  sku: `belgica-${name.toLowerCase()}-330`,
  name,
  country: "BÉLGICA",
  style: "Tripel",
  volume_ml: 330,
  abv: 8,
  cost_price: 65,
  sale_price: 100,
  stock_status: "in_stock",
  is_active: true,
  ...overrides,
});

const rows: MonasterioRow[] = [
  row("RETIRADA"),
  row("PENDIENTE"),
  row("MARGEN", { cost_price: 70, sale_price: 105 }),
  row("INACTIVA"),
  row("CORREGIDA", { style: "Tripel" }),
  row("VACIA", { style: "Blonde", abv: 6.5 }),
  row("NUEVA", { rowNumber: 30, sku: "belgica-nueva-330" }),
  row("Nueva", { rowNumber: 31, sku: "belgica-nueva-330-b" }),
];

const plan = buildCatalogPlan(rows, existing, "monasterio");
const upd = (id: string) => plan.updates.find((u) => u.id === id)!;

// 1. Una retirada que viene «disponible» se ignora: no se actualiza ni se reactiva.
assert.equal(plan.ignored.length, 1);
assert.equal(plan.ignored[0].id, "a");
assert.equal(plan.updates.some((u) => u.id === "a"), false);

// 2. Una pendiente actualiza disponibilidad, pero la carga no la activa.
assert.equal(upd("b").active.to, false);
assert.equal(upd("b").changes.stock_status, "in_stock");
assert.equal("is_active" in upd("b").changes, false);

// 3. El margen personalizado se respeta: 70 / 0.5 = 140.
assert.equal(upd("c").price.to, 140);

// 4. Una inactiva no retirada se reactivaría: aparece para decidir en la vista previa.
assert.equal(isReactivation(upd("d")), true);

// 5. País y estilo corregidos a mano no se sobrescriben; la diferencia se informa.
assert.equal("style" in upd("e").changes, false);
assert.equal("country" in upd("e").changes, false);
assert.deepEqual(upd("e").info.map((i) => i.field), ["style"]);

// 6. Estilo y ABV vacíos se llenan desde el archivo.
assert.equal(upd("h").changes.style, "Blonde");
assert.equal(upd("h").changes.abv, 6.5);

// 7. Nueva: entra una sola vez aunque venga repetida (mayúsculas distintas).
assert.equal(plan.news.length, 1);
assert.equal(plan.news[0].name, "NUEVA");
assert.ok(plan.errors.some((e) => e.includes("repetida")));

// 8. De Monasterio y ya no viene en la lista: pasa a agotada. La manual no se toca.
assert.deepEqual(plan.missing.map((m) => m.id), ["f"]);

// 9. Con la plantilla genérica no se agota nada por ausencia ni se marca proveedor.
const template = buildCatalogPlan(rows, existing, "plantilla");
assert.equal(template.missing.length, 0);
assert.equal(template.tagProvider.length, 0);

// 10. El proveedor se marca en las que vienen en el archivo de Monasterio (no en retiradas).
assert.ok(plan.tagProvider.includes("c"));
assert.equal(plan.tagProvider.includes("a"), false);

// 11. La huella cambia si cambia el plan.
assert.notEqual(plan.fingerprint, buildCatalogPlan(rows.filter((r) => r.name !== "MARGEN"), existing, "monasterio").fingerprint);

// Cervecería deducida para las nuevas (la lista de Monasterio no la trae).
{
  const guess = breweryGuesser([
    { name: "MONKEY WAVES ESLABÓN POR ESLABÓN", brewery: "Monkey Waves" },
    { name: "JABALÍ BOCK", brewery: "Primus" },
    { name: "JABALÍ IPA", brewery: "Primus" },
    { name: "BELCHING BEAVER PEANUT BUTTER", brewery: "Belching Beaver Brewery" },
    { name: "BIRRA MORETTI", brewery: "Birra Moretti" },
    { name: "BIRRA BALADIN NORA", brewery: "Baladin" },
  ]);
  assert.equal(guess("MONKEY WAVES NUEVA HAZY"), "Monkey Waves");
  assert.equal(guess("JABALÍ STOUT"), "Primus");
  assert.equal(guess("BELCHING BEAVER DEFT JAB"), "Belching Beaver Brewery");
  assert.equal(guess("BIRRA BALADIN ISAAC"), undefined); // «BIRRA» es de dos cervecerías: sin certeza
  assert.equal(guess("CERVEZA DESCONOCIDA"), undefined);
}

console.log("OK: 11 reglas de la carga masiva verificadas.");
