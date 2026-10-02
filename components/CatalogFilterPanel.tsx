"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  ABV_RANGES,
  facetOptions,
  normalize,
  PRICE_PRESETS,
  type CatalogFilters,
  type FacetOption,
  type FilterableProduct,
} from "@/lib/catalog-filters";
import { formatMXN } from "@/lib/pricing";
import { useIsClient } from "@/lib/use-is-client";

type Facet = "countries" | "breweries";

const COLLAPSED_OPTIONS = 6;
const SEARCHABLE_OPTIONS = 10;

export function chipClass(active: boolean) {
  return `rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-canvas text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

export function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-black/5 pt-4 first:border-0 first:pt-0">
      <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const term = normalize(search);
  // Seleccionados primero, luego los que tienen resultados: lo útil queda arriba.
  const sorted = [...options].sort(
    (a, b) =>
      Number(selected.includes(b.value)) - Number(selected.includes(a.value)) ||
      Number(b.count > 0) - Number(a.count > 0)
  );
  const matching = term ? sorted.filter((o) => normalize(o.value).includes(term)) : sorted;
  const visible = expanded || term ? matching : matching.slice(0, COLLAPSED_OPTIONS);

  return (
    <div className="space-y-0.5">
      {options.length > SEARCHABLE_OPTIONS && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar entre ${options.length}…`}
          className="mb-1.5 w-full rounded-full bg-canvas px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/15"
        />
      )}
      {term && matching.length === 0 && <p className="px-2 py-1.5 text-xs text-muted">Sin coincidencias.</p>}
      {visible.map(({ value, count }) => {
        const checked = selected.includes(value);
        const disabled = count === 0 && !checked;
        return (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-canvas ${
              disabled ? "opacity-40" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(value)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded accent-accent"
            />
            <span className="min-w-0 flex-1 truncate">{value}</span>
            <span className="text-xs tabular-nums text-muted">{count}</span>
          </label>
        );
      })}
      {!term && matching.length > COLLAPSED_OPTIONS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 pt-1 text-xs font-semibold text-accent hover:underline"
        >
          {expanded ? "Ver menos" : `Ver todos (${matching.length})`}
        </button>
      )}
    </div>
  );
}

function parsePrice(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function FilterPanel({
  products,
  filters,
  setFilters,
}: {
  products: FilterableProduct[];
  filters: CatalogFilters;
  setFilters: (update: (current: CatalogFilters) => CatalogFilters) => void;
}) {
  const countries = useMemo(() => facetOptions(products, filters, "countries"), [products, filters]);
  const breweries = useMemo(() => facetOptions(products, filters, "breweries"), [products, filters]);

  function toggle(facet: Facet, value: string) {
    setFilters((current) => ({
      ...current,
      [facet]: current[facet].includes(value)
        ? current[facet].filter((v) => v !== value)
        : [...current[facet], value],
    }));
  }

  return (
    <div className="space-y-4">
      <FilterSection title="Precio">
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFilters((c) => ({
                    ...c,
                    minPrice: active ? null : preset.min,
                    maxPrice: active ? null : preset.max,
                  }))
                }
                className={chipClass(active)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Mín"
            aria-label="Precio mínimo"
            value={filters.minPrice ?? ""}
            onChange={(e) => setFilters((c) => ({ ...c, minPrice: parsePrice(e.target.value) }))}
            className="w-full min-w-0 rounded-full bg-canvas px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/15"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Máx"
            aria-label="Precio máximo"
            value={filters.maxPrice ?? ""}
            onChange={(e) => setFilters((c) => ({ ...c, maxPrice: parsePrice(e.target.value) }))}
            className="w-full min-w-0 rounded-full bg-canvas px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/15"
          />
        </div>
      </FilterSection>

      <FilterSection title="Nivel de alcohol">
        <div className="flex flex-wrap gap-1.5">
          {ABV_RANGES.map((range) => {
            const active = filters.abv === range.id;
            return (
              <button
                key={range.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilters((c) => ({ ...c, abv: active ? null : range.id }))}
                className={chipClass(active)}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {countries.length > 0 && (
        <FilterSection title="País">
          <CheckboxList options={countries} selected={filters.countries} onToggle={(v) => toggle("countries", v)} />
        </FilterSection>
      )}

      {breweries.length > 0 && (
        <FilterSection title="Marca / Cervecería">
          <CheckboxList options={breweries} selected={filters.breweries} onToggle={(v) => toggle("breweries", v)} />
        </FilterSection>
      )}
    </div>
  );
}

/** Panel lateral (slide-over) con los filtros; se monta en <body> para no depender de ningún contenedor. */
export function FilterDrawer({
  isOpen,
  onClose,
  resultCount,
  noun,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  resultCount: number;
  /** Singular y plural del producto en el botón «Ver N …». */
  noun: [string, string];
  children: ReactNode;
}) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
            className="absolute inset-0 bg-black/40"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Filtros del catálogo"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-y-0 right-0 flex w-[min(24rem,90vw)] flex-col rounded-l-[28px] bg-white shadow-card"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="text-lg font-semibold tracking-[-0.03em]">Filtros</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex h-11 w-11 items-center justify-center rounded-full text-black/70 hover:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">{children}</div>
            <div className="border-t border-black/5 p-4">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 w-full rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-accent"
              >
                Ver {resultCount} {resultCount === 1 ? noun[0] : noun[1]}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}


/** Chips de los filtros activos (cada uno con su acción para quitarlo). */
export function activeFilterChips(
  filters: CatalogFilters,
  setFilters: (update: (current: CatalogFilters) => CatalogFilters) => void
): { key: string; label: string; clear: () => void }[] {
  return [
    ...(["countries", "breweries"] as const).flatMap((facet) =>
      filters[facet].map((value) => ({
        key: `${facet}:${value}`,
        label: value,
        clear: () => setFilters((c) => ({ ...c, [facet]: c[facet].filter((v) => v !== value) })),
      }))
    ),
    ...(filters.minPrice !== null || filters.maxPrice !== null
      ? [
          {
            key: "price",
            label:
              filters.minPrice !== null && filters.maxPrice !== null
                ? `${formatMXN(filters.minPrice)} – ${formatMXN(filters.maxPrice)}`
                : filters.minPrice !== null
                  ? `Desde ${formatMXN(filters.minPrice)}`
                  : `Hasta ${formatMXN(filters.maxPrice!)}`,
            clear: () => setFilters((c) => ({ ...c, minPrice: null, maxPrice: null })),
          },
        ]
      : []),
    ...(filters.abv
      ? [
          {
            key: "abv",
            label: ABV_RANGES.find((r) => r.id === filters.abv)!.label,
            clear: () => setFilters((c) => ({ ...c, abv: null })),
          },
        ]
      : []),
  ];
}
