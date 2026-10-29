/**
 * Pruebas de lectura y escritura del estado del catálogo en la URL (sin base de datos).
 * Uso: npx tsx scripts/test-catalog-url.ts
 */
import assert from "node:assert/strict";
import { EMPTY_FILTERS, PAGE_SIZE } from "@/lib/catalog-filters";
import { DEFAULT_CATALOG_STATE, parseCatalogState, serializeCatalogState } from "@/lib/catalog-url";

const leer = (query: string, known?: Parameters<typeof parseCatalogState>[1]) => parseCatalogState(new URLSearchParams(query), known);
const known = { countries: new Set(["México", "Bélgica"]), breweries: new Set(["Wendlandt", "Delirium"]) };

// Vacío → valores por defecto; y el estado por defecto se escribe como URL vacía.
assert.deepEqual(leer(""), DEFAULT_CATALOG_STATE);
assert.equal(serializeCatalogState(DEFAULT_CATALOG_STATE), "");

// Valores válidos.
const completo = leer("q=ipa&orden=price-asc&pais=M%C3%A9xico&pais=B%C3%A9lgica&cerveceria=Wendlandt&min=100&max=400.5&abv=media&ver=72", known);
assert.deepEqual(completo, {
  filters: { query: "ipa", countries: ["México", "Bélgica"], breweries: ["Wendlandt"], minPrice: 100, maxPrice: 400.5, abv: "media" },
  sort: "price-asc",
  visible: 72,
});

// Escribir y volver a leer devuelve lo mismo (ida y vuelta).
assert.deepEqual(leer(serializeCatalogState(completo), known), completo);
assert.equal(
  serializeCatalogState(completo),
  "q=ipa&orden=price-asc&pais=M%C3%A9xico&pais=B%C3%A9lgica&cerveceria=Wendlandt&min=100&max=400.5&abv=media&ver=72",
);

// Inválidos: se descartan sin romper.
const malo = leer("orden=hackeado&abv=xx&min=-5&max=abc&ver=7&pais=Narnia&cerveceria=Nadie&q=" + "x".repeat(300), known);
assert.equal(malo.sort, "default");
assert.equal(malo.filters.abv, null);
assert.equal(malo.filters.minPrice, null);
assert.equal(malo.filters.maxPrice, null);
assert.equal(malo.visible, PAGE_SIZE);
assert.deepEqual(malo.filters.countries, []);
assert.deepEqual(malo.filters.breweries, []);
assert.equal(malo.filters.query.length, 100);

// «default» no es un valor válido para escribir ni para leer como orden explícito en la URL.
assert.equal(serializeCatalogState({ ...DEFAULT_CATALOG_STATE, sort: "default" }), "");
assert.equal(leer("orden=default").sort, "default");

// Vacíos y repetidos.
assert.deepEqual(leer("pais=&pais=%20&min=&max=").filters, EMPTY_FILTERS);
assert.deepEqual(leer("pais=México&pais=México", known).filters.countries, ["México"]);
assert.equal(leer("min=500&max=100").filters.maxPrice, null);
assert.equal(leer("min=500&max=100").filters.minPrice, 500);
assert.equal(leer("max=9999999").filters.maxPrice, 100000);
assert.equal(leer("ver=999999").visible, 1000);

// Sin lista de conocidos (p. ej. catálogo vacío) los países se aceptan tal cual.
assert.deepEqual(leer("pais=Chile").filters.countries, ["Chile"]);

// Espacios en la búsqueda no se escriben.
assert.equal(serializeCatalogState({ ...DEFAULT_CATALOG_STATE, filters: { ...EMPTY_FILTERS, query: "   " } }), "");

console.log("OK: lectura y escritura del estado del catálogo en la URL verificadas.");
