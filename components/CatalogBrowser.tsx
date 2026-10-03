"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  matchesFilters,
  SEARCH_PARAM,
  SORT_OPTIONS,
  sortProducts,
  type CatalogFilters,
  type SortId,
} from "@/lib/catalog-filters";
import { activeFilterChips, FilterDrawer, FilterPanel } from "./CatalogFilterPanel";
import ProductCard from "./ProductCard";

/** Catálogo con buscador y filtros en tiempo real (País, Precio, ABV y Marca). */
export default function CatalogBrowser({ products }: { products: Product[] }) {
  const urlQuery = useSearchParams().get(SEARCH_PARAM) ?? "";
  const [filters, setFilters] = useState<CatalogFilters>(() => ({ ...EMPTY_FILTERS, query: urlQuery }));
  const [appliedUrlQuery, setAppliedUrlQuery] = useState(urlQuery);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sort, setSort] = useState<SortId>("default");

  // Búsqueda nueva desde el header (`/tienda?q=`): se aplica durante el render, sin efecto de más.
  if (urlQuery !== appliedUrlQuery) {
    setAppliedUrlQuery(urlQuery);
    setFilters((current) => ({ ...current, query: urlQuery }));
  }

  useEffect(() => {
    if (!urlQuery) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("catalogo")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [urlQuery]);
  // El texto se filtra con prioridad baja: escribir nunca se siente trabado.
  const deferredFilters = useDeferredValue(filters);

  const results = useMemo(
    () => sortProducts(products.filter((product) => matchesFilters(product, deferredFilters)), sort),
    [products, deferredFilters, sort]
  );
  const activeCount = activeFilterCount(filters);
  const hasAnyFilter = activeCount > 0 || filters.query.trim() !== "";

  const activeChips = activeFilterChips(filters, setFilters);

  const panel = <FilterPanel products={products} filters={filters} setFilters={setFilters} />;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-full flex-1 md:min-w-0">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilters((c) => ({ ...c, query: e.target.value }))}
            placeholder="Busca por nombre, estilo, país o cervecería"
            aria-label="Buscar cervezas"
            className="h-12 w-full rounded-full bg-white pl-11 pr-5 text-sm shadow-card outline-none focus:ring-2 focus:ring-black/15"
          />
        </div>
        <div className="relative min-w-0 flex-1 md:w-48 md:flex-none">
          <ArrowUpDown size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="Ordenar por"
            className="h-12 w-full cursor-pointer appearance-none truncate rounded-full bg-white pl-10 pr-10 text-sm font-semibold shadow-card outline-none focus:ring-2 focus:ring-black/15"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-card md:w-48 md:flex-none"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <FilterDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} resultCount={results.length} noun={["cerveza", "cervezas"]}>
        {panel}
      </FilterDrawer>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? "cerveza" : "cervezas"}
        </p>
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.clear}
            aria-label={`Quitar filtro ${chip.label}`}
            className="flex items-center gap-1 rounded-full bg-white py-1.5 pl-3 pr-2 text-xs font-semibold shadow-card hover:bg-black hover:text-white"
          >
            {chip.label}
            <X size={13} />
          </button>
        ))}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="rounded-[28px] bg-white px-6 py-14 text-center shadow-card">
          <p className="text-lg font-semibold tracking-[-0.03em]">Ninguna cerveza coincide</p>
          <p className="mt-1 text-sm text-muted">Prueba con otros filtros o una búsqueda más corta.</p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-accent"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
