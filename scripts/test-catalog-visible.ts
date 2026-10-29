/**
 * Pruebas de `?ver=` (cuántas tarjetas se ven en /tienda y categorías), sin base de datos.
 * Uso: npx tsx scripts/test-catalog-visible.ts
 */
import assert from "node:assert/strict";
import { PAGE_SIZE, parseVisibleCount } from "@/lib/catalog-filters";

assert.equal(parseVisibleCount(null), PAGE_SIZE);
assert.equal(parseVisibleCount("48"), 48);
assert.equal(parseVisibleCount("24"), 24);
assert.equal(parseVisibleCount("10"), PAGE_SIZE);
assert.equal(parseVisibleCount("-48"), PAGE_SIZE);
assert.equal(parseVisibleCount("abc"), PAGE_SIZE);
assert.equal(parseVisibleCount("48.5"), PAGE_SIZE);
assert.equal(parseVisibleCount("999999"), 1000);

console.log("OK: 8 casos de ?ver= verificados.");
