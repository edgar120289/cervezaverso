/**
 * Pruebas de la búsqueda tolerante a errores de dedo (sin base de datos).
 * Uso: npx tsx scripts/test-fuzzy-search.ts
 */
import assert from "node:assert/strict";
import type { FilterableProduct } from "@/lib/catalog-filters";
import { buildVocabulary, correctQuery, editDistance, fuzzyIncludes } from "@/lib/fuzzy-search";

const p = (name: string, style: string, brewery: string, country: string): FilterableProduct => ({
  name,
  style,
  brewery,
  country,
  abv: 5,
  sale_price: 100,
});

const catalogo = [
  p("SCHÖFFERHOFER NATURTRÜB", "HEFEWEIZEN", "Schöfferhofer", "ALEMANIA"),
  p("SCHÖFFERHOFER SANDÍA MENTA", "HEFEWEIZEN CON FRUTA", "Schöfferhofer", "ALEMANIA"),
  p("DELIRIUM TREMENS", "BELGIAN STRONG ALE", "Delirium", "BÉLGICA"),
  p("GUINNESS DRAUGHT", "IRISH DRY STOUT", "Guinness", "IRLANDA"),
  p("RÁMURI LÁGRIMAS NEGRAS", "IMPERIAL CACAO STOUT", "Rámuri", "MÉXICO"),
  p("SCHLENKERLA RAUCHBIER MÄRZEN", "MÄRZEN", "Schlenkerla", "ALEMANIA"),
  p("FULLER'S LONDON PRIDE", "BITTER", "Fuller's", "INGLATERRA"),
  p("INSURGENTE LA LUPULOSA", "IPA", "Wendlandt", "MÉXICO"),
];
const vocabulario = buildVocabulary(catalogo);
const corrige = (q: string) => correctQuery(q, catalogo, vocabulario);

// Distancia: letra de más, de menos, cambiada o volteada.
assert.equal(editDistance("stuot", "stout", 2), 1);
assert.equal(editDistance("guiness", "guinness", 2), 1);
assert.equal(editDistance("abc", "xyz", 1), 2);

// Errores de dedo que ahora sí encuentran algo.
assert.equal(corrige("shoferhofer"), "schöfferhofer");
assert.equal(corrige("hefeweisen"), "hefeweizen");
assert.equal(corrige("delirum"), "delirium");
assert.equal(corrige("guiness"), "guinness");
assert.equal(corrige("estaut"), "stout");
assert.equal(corrige("lagrimaz negras"), "lágrimas negras");
assert.equal(corrige("schofer"), "schöfferhofer"); // a medio escribir
assert.equal(corrige("londn pride"), "london pride");

// Lo que ya se encuentra no se toca (acentos y mayúsculas ya se ignoraban).
assert.equal(corrige("ramuri"), null);
assert.equal(corrige("Schöfferhofer"), null);
assert.equal(corrige("marzen"), null);
assert.equal(corrige("stout"), null);
assert.equal(corrige(""), null);

// Palabras cortas o sin nada parecido: no se inventa una sugerencia.
assert.equal(corrige("xyz"), null);
assert.equal(corrige("tequila"), null);
assert.equal(corrige("ipx"), null);

// Buscador de la lista de cervecerías del panel de filtros.
assert.equal(fuzzyIncludes("wendladt", "Wendlandt"), true);
assert.equal(fuzzyIncludes("ramuri", "Rámuri"), true);
assert.equal(fuzzyIncludes("guines", "Guinness"), true);
assert.equal(fuzzyIncludes("asahi", "Guinness"), false);

console.log("OK: búsqueda tolerante a errores de dedo verificada.");
