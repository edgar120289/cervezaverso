/**
 * Pruebas de normalCase y del orden de vitrina con nombres reales del catálogo (sin base de datos).
 * Uso: npx tsx scripts/test-text-case.ts
 */
import assert from "node:assert/strict";
import { byShowcase } from "@/lib/catalog-filters";
import { normalCase } from "@/lib/text-case";
import type { Product } from "@/lib/types";

const casos: [string, string][] = [
  ["FIRESTONE WALKER PARABOLA 2025", "Firestone Walker Parabola 2025"],
  ["FULLER'S LONDON PRIDE", "Fuller's London Pride"],
  ["BRUGSE ZOT PACK CON COPA", "Brugse Zot Pack con Copa"],
  ["BARRIL DELIRIUM TREMENS", "Barril Delirium Tremens"],
  ["KNEE DEEP SIMTRA TRIPLE IPA", "Knee Deep Simtra Triple IPA"],
  ["DUVEL 330ML", "Duvel 330 ml"],
  ["STOUT CON AVELLANA Y VAINILLA", "Stout con Avellana y Vainilla"],
  ["IMPERIAL STOUT AGED IN BOURBON BARRELS", "Imperial Stout Aged In Bourbon Barrels"],
  ["TSINGTAO IPA", "Tsingtao IPA"],
  ["BÉLGICA", "Bélgica"],
  ["USA", "USA"],
  ["Birra Baladin Lippa IPA", "Birra Baladin Lippa IPA"],
];
for (const [entrada, esperado] of casos) assert.equal(normalCase(entrada), esperado, entrada);

const base = { sku: "x", name: "A", stock_status: "in_stock", image_url: "u", is_featured: false } as unknown as Product;
const p = (name: string, extra: Partial<Product>) => ({ ...base, name, ...extra }) as Product;
const orden = [
  p("Z destacada sin foto", { is_featured: true, image_url: null }),
  p("Y con foto pocas", { stock_status: "low_stock" }),
  p("B con foto", {}),
  p("A con foto", {}),
  p("C sin foto", { image_url: null }),
  p("D destacada", { is_featured: true }),
];
assert.deepEqual(
  [...orden].sort(byShowcase).map((x) => x.name),
  ["D destacada", "Z destacada sin foto", "A con foto", "B con foto", "Y con foto pocas", "C sin foto"],
);

console.log(`OK: ${casos.length} casos de normalCase y orden de vitrina verificados.`);
