import {
  ABV_RANGES,
  EMPTY_FILTERS,
  PAGE_SIZE,
  parseVisibleCount,
  SORT_OPTIONS,
  type CatalogFilters,
  type SortId,
} from "@/lib/catalog-filters";

/** Estado del catálogo público que vive en la URL: sobrevive a «Atrás» y se puede compartir. */
export type CatalogUrlState = {
  filters: CatalogFilters;
  sort: SortId;
  /** Tarjetas visibles (`?ver=`). */
  visible: number;
};

export const DEFAULT_CATALOG_STATE: CatalogUrlState = { filters: EMPTY_FILTERS, sort: "default", visible: PAGE_SIZE };

type ParamReader = { get(name: string): string | null; getAll(name: string): string[] };

/** Valores que la tienda conoce; los de país y cervecería que no estén aquí se descartan al leer la URL. */
export type KnownFacets = { countries: ReadonlySet<string>; breweries: ReadonlySet<string> };

const MAX_QUERY_LENGTH = 100;
const MAX_FACET_VALUES = 50;
const MAX_PRICE = 100000;

function readPrice(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, MAX_PRICE) : null;
}

function readFacet(values: string[], known?: ReadonlySet<string>): string[] {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  return unique.filter((value) => !known || known.has(value)).slice(0, MAX_FACET_VALUES);
}

/** Lee la URL descartando cualquier valor desconocido o inválido (la URL es entrada no confiable). */
export function parseCatalogState(params: ParamReader, known?: KnownFacets): CatalogUrlState {
  const sort = params.get("orden");
  const abv = params.get("abv");
  const minPrice = readPrice(params.get("min"));
  let maxPrice = readPrice(params.get("max"));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) maxPrice = null;

  return {
    filters: {
      query: params.get("q")?.slice(0, MAX_QUERY_LENGTH) ?? "",
      countries: readFacet(params.getAll("pais"), known?.countries),
      breweries: readFacet(params.getAll("cerveceria"), known?.breweries),
      minPrice,
      maxPrice,
      abv: ABV_RANGES.find((range) => range.id === abv)?.id ?? null,
    },
    sort: SORT_OPTIONS.find((option) => option.id === sort)?.id ?? DEFAULT_CATALOG_STATE.sort,
    visible: parseVisibleCount(params.get("ver")),
  };
}

/** Solo escribe lo que difiere del valor por defecto, para mantener la URL corta. */
export function serializeCatalogState(state: CatalogUrlState): string {
  const params = new URLSearchParams();
  const { filters } = state;
  if (filters.query.trim()) params.set("q", filters.query.trim().slice(0, MAX_QUERY_LENGTH));
  if (state.sort !== DEFAULT_CATALOG_STATE.sort) params.set("orden", state.sort);
  filters.countries.forEach((value) => params.append("pais", value));
  filters.breweries.forEach((value) => params.append("cerveceria", value));
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.abv) params.set("abv", filters.abv);
  if (state.visible > PAGE_SIZE) params.set("ver", String(state.visible));
  return params.toString();
}
