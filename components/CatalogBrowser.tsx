"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  matchesFilters,
  PAGE_SIZE,
  SEARCH_PARAM,
  SORT_OPTIONS,
  sortProducts,
  type CatalogFilters,
  type SortId,
} from "@/lib/catalog-filters";
import { parseCatalogState, serializeCatalogState } from "@/lib/catalog-url";
import { activeFilterChips, FilterDrawer, FilterPanel } from "./CatalogFilterPanel";
import CategoriesMenu from "./CategoriesMenu";
import ProductCard from "./ProductCard";

/** Catálogo con buscador y filtros en tiempo real (País, Precio, ABV y Marca). */
export default function CatalogBrowser({ products }: { products: Product[] }) {
  // La URL es la memoria del catálogo: se lee al montar (incluye «atrás» y enlaces compartidos) y cada cambio
  // se refleja con replaceState. Los países y cervecerías de la URL que no existan en el catálogo se descartan.
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get(SEARCH_PARAM) ?? "";
  const [initial] = useState(() =>
    parseCatalogState(searchParams, {
      countries: new Set(products.map((product) => product.country.trim())),
      breweries: new Set(products.map((product) => product.brewery?.trim()).filter(Boolean) as string[]),
    })
  );
  const [filters, setFilters] = useState<CatalogFilters>(initial.filters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sort, setSort] = useState<SortId>(initial.sort);
  const [visible, setVisible] = useState(initial.visible);
  // Última búsqueda que escribió esta página en la URL: distingue nuestras escrituras de una búsqueda nueva del header.
  const writtenQuery = useRef<string | null>(null);

  // Búsqueda nueva desde el header (`/tienda?q=`): se aplica al texto y lleva el scroll al catálogo.
  useEffect(() => {
    if (urlQuery === writtenQuery.current) return;
    writtenQuery.current = urlQuery;
    setFilters((current) => (current.query === urlQuery ? current : { ...current, query: urlQuery }));
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
  // Cualquier cambio de búsqueda, filtros u orden vuelve a la primera página.
  const resetKey = JSON.stringify([deferredFilters, sort]);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (resetKey !== appliedResetKey) {
    setAppliedResetKey(resetKey);
    setVisible(PAGE_SIZE);
  }

  // replaceState (no push) deja una sola entrada de historial; con espera para no saturarlo al teclear.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = serializeCatalogState({ filters, sort, visible });
      writtenQuery.current = filters.query.trim();
      if (query === window.location.search.replace(/^\?/, "")) return;
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters, sort, visible]);

  // Tras «Ver más» el foco pasa a la primera tarjeta nueva, para teclado y lectores de pantalla.
  const gridRef = useRef<HTMLDivElement>(null);
  const focusIndex = useRef<number | null>(null);
  useEffect(() => {
    if (focusIndex.current === null) return;
    gridRef.current?.children[focusIndex.current]?.querySelector("a")?.focus();
    focusIndex.current = null;
  }, [visible]);

  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;
  const activeCount = activeFilterCount(filters);
  const hasAnyFilter = activeCount > 0 || filters.query.trim() !== "";

  const activeChips = activeFilterChips(filters, setFilters);

  const panel = <FilterPanel products={products} filters={filters} setFilters={setFilters} />;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-3 md:gap-4">
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
          <ArrowUpDown size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 sm:block" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="Ordenar por"
            className="h-12 w-full cursor-pointer appearance-none truncate rounded-full bg-white pl-3 pr-7 text-sm sm:pl-10 sm:pr-10 font-semibold shadow-card outline-none focus:ring-2 focus:ring-black/15"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 sm:right-4" />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-semibold shadow-card sm:px-4 md:w-48 md:flex-none"
        >
          <SlidersHorizontal size={16} className="hidden sm:block" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
        <CategoriesMenu />
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
        <>
          <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {remaining > 0 && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => {
                  focusIndex.current = shown.length;
                  setVisible((current) => current + PAGE_SIZE);
                }}
                className="min-h-12 rounded-full bg-white px-7 text-sm font-semibold shadow-card transition-transform hover:bg-black hover:text-white active:scale-[0.98]"
              >
                Ver más ({remaining} {remaining === 1 ? "restante" : "restantes"})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
