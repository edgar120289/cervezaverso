// Pruebas de la descripción SEO/Merchant. Ejecutar con: npx tsx scripts/test-product-description.ts
import assert from "node:assert/strict";
import { productSeoDescription } from "../lib/product-description";
import type { Product } from "../lib/types";

const base = {
  id: "1", sku: "x", name: "DELIRIUM TREMENS", brewery: "DELIRIUM", gtin: null, country: "Bélgica", style: "Belgian Blond Strong Ale",
  abv: 8.5, volume_ml: 330, sale_price: 175, stock_status: "in_stock", badges: [], description_ai: null, pairing_ai: null,
  notas_origen: null, notas_perfil: null, notas_maridaje: null, image_url: null, image_urls: [], created_at: "",
} as Product;

// Sin notas: datos de la ficha + aviso, sin inventar nada
const solo = productSeoDescription(base);
assert.match(solo, /^Delirium Tremens es una cerveza estilo Belgian Blond Strong Ale de Delirium, de Bélgica, con 8\.5% de alcohol \(ABV\) y presentación de 330 ml\./);
assert.ok(solo.length >= 150, `muy corta (${solo.length})`);

// Con notas: las incluye sin duplicar
const rica = productSeoDescription({ ...base, description_ai: "Rubia fuerte y burbujeante.", notas_perfil: "Frutal, especiada.", notas_maridaje: "Quesos suaves" });
assert.match(rica, /Rubia fuerte y burbujeante\. Frutal, especiada\. Maridaje: Quesos suaves\./);

// Datos faltantes: no aparece «undefined», «null» ni «0%»
const vacia = productSeoDescription({ ...base, brewery: null as unknown as string, abv: 0, volume_ml: 0, style: "" });
assert.doesNotMatch(vacia, /undefined|null|0%|0 ml/);

// Hidromiel
assert.match(productSeoDescription({ ...base, name: "Hidromiel Miel y Sol", style: "Mead" }), /es una hidromiel/);
console.log("test-product-description: ok");
