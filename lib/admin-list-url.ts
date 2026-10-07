import { ABV_RANGES, EMPTY_FILTERS, type CatalogFilters } from "@/lib/catalog-filters";

export const STATUS_IDS = ["all", "active", "inactive"] as const;
export const SORT_IDS = [
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "stock-available",
  "stock-out",
  "newest",
] as const;

export type StatusFilter = (typeof STATUS_IDS)[number];
export type AdminSortId = (typeof SORT_IDS)[number];

/** Estado del inventario del admin que vive en la URL: sobrevive a «Atrás» y se puede compartir. */
export type AdminListState = {
  search: string;
  status: StatusFilter;
  sort: AdminSortId;
  featuredOnly: boolean;
  filters: CatalogFilters;
};

export const DEFAULT_LIST_STATE: AdminListState = {
  search: "",
  status: "all",
  sort: "name-asc",
  featuredOnly: false,
  filters: EMPTY_FILTERS,
};

type ParamReader = { get(name: string): string | null; getAll(name: string): string[] };

function readPrice(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Lee la URL descartando cualquier valor desconocido (la URL es entrada no confiable). */
export function parseListState(params: ParamReader): AdminListState {
  const status = params.get("estado");
  const sort = params.get("orden");
  const abv = params.get("abv");
  return {
    search: params.get("q")?.slice(0, 100) ?? "",
    status: STATUS_IDS.find((id) => id === status) ?? DEFAULT_LIST_STATE.status,
    sort: SORT_IDS.find((id) => id === sort) ?? DEFAULT_LIST_STATE.sort,
    featuredOnly: params.get("destacadas") === "1",
    filters: {
      ...EMPTY_FILTERS,
      countries: params.getAll("pais"),
      breweries: params.getAll("cerveceria"),
      minPrice: readPrice(params.get("min")),
      maxPrice: readPrice(params.get("max")),
      abv: ABV_RANGES.find((r) => r.id === abv)?.id ?? null,
    },
  };
}

/** Solo escribe lo que difiere del valor por defecto, para mantener la URL corta. */
export function serializeListState(state: AdminListState): string {
  const params = new URLSearchParams();
  const { filters } = state;
  if (state.search.trim()) params.set("q", state.search.trim());
  if (state.status !== DEFAULT_LIST_STATE.status) params.set("estado", state.status);
  if (state.sort !== DEFAULT_LIST_STATE.sort) params.set("orden", state.sort);
  if (state.featuredOnly) params.set("destacadas", "1");
  filters.countries.forEach((value) => params.append("pais", value));
  filters.breweries.forEach((value) => params.append("cerveceria", value));
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.abv) params.set("abv", filters.abv);
  return params.toString();
}
