import type { Product } from "@/lib/types";

/** Parámetro de URL con el texto buscado desde el header (`/?q=…`). */
export const SEARCH_PARAM = "q";

/** Filtros del catálogo de la tienda. Se aplican en el cliente sobre el catálogo ya cargado. */
export type CatalogFilters = {
  query: string;
  countries: string[];
  breweries: string[];
  minPrice: number | null;
  maxPrice: number | null;
  abv: AbvRangeId | null;
};

export const EMPTY_FILTERS: CatalogFilters = {
  query: "",
  countries: [],
  breweries: [],
  minPrice: null,
  maxPrice: null,
  abv: null,
};

export const PRICE_PRESETS = [
  { label: "Hasta $100", min: null, max: 100 },
  { label: "$100 – $200", min: 100, max: 200 },
  { label: "$200 – $400", min: 200, max: 400 },
  { label: "Más de $400", min: 400, max: null },
] as const;

export const ABV_RANGES = [
  { id: "sin", label: "Sin alcohol", min: 0, max: 1 },
  { id: "ligera", label: "Ligera · hasta 5%", min: 1, max: 5 },
  { id: "media", label: "Media · 5 – 7%", min: 5, max: 7 },
  { id: "fuerte", label: "Fuerte · 7 – 10%", min: 7, max: 10 },
  { id: "extra", label: "Extra fuerte · 10%+", min: 10, max: Infinity },
] as const;

export type AbvRangeId = (typeof ABV_RANGES)[number]["id"];

/** Minúsculas y sin acentos: "Bélgica" encuentra "belgica". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const NON_ALCOHOLIC = /\b0[.,]0\b|\bcero\b|sin alcohol|alcohol ?fre[ei]|alkoholfrei|alcoholfree|non-alcoholic|no alcoh/;

/**
 * ABV para filtrar. En la lista del proveedor `abv = 0` significa tanto "0.0%"
 * como "sin dato" (paquetes con copa, varios estilos): sólo se toma como 0 si
 * el nombre o el estilo dicen que es sin alcohol; si no, queda fuera del filtro.
 */
export function filterableAbv(product: Product): number | null {
  if (product.abv > 0) return product.abv;
  return NON_ALCOHOLIC.test(normalize(`${product.name} ${product.style}`)) ? 0 : null;
}

type Facet = "countries" | "breweries";

const FACET_FIELD: Record<Facet, (p: Product) => string | null> = {
  countries: (p) => p.country,
  breweries: (p) => p.brewery,
};

/** ¿El producto pasa todos los filtros? `ignore` omite una faceta (para contar sus opciones). */
export function matchesFilters(product: Product, filters: CatalogFilters, ignore?: Facet): boolean {
  if (filters.query) {
    const haystack = normalize(
      [product.name, product.brewery, product.style, product.country].filter(Boolean).join(" ")
    );
    // Cada palabra buscada debe aparecer en algún campo, en cualquier orden.
    if (!normalize(filters.query).split(/\s+/).every((word) => haystack.includes(word))) return false;
  }

  for (const facet of ["countries", "breweries"] as const) {
    if (facet === ignore || filters[facet].length === 0) continue;
    const value = FACET_FIELD[facet](product);
    if (!value || !filters[facet].includes(value)) return false;
  }

  if (filters.minPrice !== null && product.sale_price < filters.minPrice) return false;
  if (filters.maxPrice !== null && product.sale_price > filters.maxPrice) return false;

  if (filters.abv) {
    const range = ABV_RANGES.find((r) => r.id === filters.abv);
    // Límite inferior incluido y superior excluido: 5% cuenta como "Media", no como "Ligera".
    const abv = filterableAbv(product);
    if (range && (abv === null || !(abv >= range.min && abv < range.max))) return false;
  }

  return true;
}

export type FacetOption = { value: string; count: number };

/**
 * Opciones de una faceta con su conteo, aplicando el resto de los filtros:
 * así el número junto a "Bélgica" dice cuántas quedarían al marcarla.
 */
export function facetOptions(products: Product[], filters: CatalogFilters, facet: Facet): FacetOption[] {
  const all = new Set<string>();
  const counts = new Map<string, number>();
  for (const product of products) {
    const value = FACET_FIELD[facet](product)?.trim();
    if (!value) continue;
    all.add(value);
    if (matchesFilters(product, filters, facet)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...all]
    .map((value) => ({ value, count: counts.get(value) ?? 0 }))
    .sort((a, b) => a.value.localeCompare(b.value, "es"));
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    filters.countries.length +
    filters.breweries.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.abv ? 1 : 0)
  );
}
