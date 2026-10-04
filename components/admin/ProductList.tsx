"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  matchesFilters,
  normalize,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";
import { activeFilterChips, chipClass, FilterDrawer, FilterPanel, FilterSection } from "@/components/CatalogFilterPanel";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import FeaturedToggle from "./FeaturedToggle";
import ProductRowActions from "./ProductRowActions";

export type AdminProductRow = {
  id: string;
  sku: string;
  name: string;
  brewery: string;
  country: string;
  style: string;
  abv: number;
  cost_price: number;
  sale_price: number;
  stock_status: StockStatus;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

const STATUS_OPTIONS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Solo activas" },
  { id: "inactive", label: "Solo inactivas" },
] as const;

const SORT_OPTIONS = [
  { id: "name-asc", label: "Nombre A-Z" },
  { id: "name-desc", label: "Nombre Z-A" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "stock-available", label: "Stock: disponibles" },
  { id: "stock-out", label: "Stock: agotadas" },
  { id: "newest", label: "Más recientes" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["id"];
type SortId = (typeof SORT_OPTIONS)[number]["id"];

/** El stock es un estado, no una cantidad: igual que la tienda, lo disponible va primero y lo agotado al final. */
const STOCK_RANK: Record<StockStatus, number> = { in_stock: 0, low_stock: 1, preorder: 2, out_of_stock: 3 };

/** Estados cuya foto se atenúa y lleva etiqueta: agotada en rojo oscuro y pocas piezas en ámbar de alerta. */
const STOCK_TAG_CLASS: Partial<Record<StockStatus, string>> = {
  out_of_stock: "bg-red-900 text-white",
  low_stock: "bg-amber-400 text-black",
};

const byName = (a: AdminProductRow, b: AdminProductRow) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });

const COMPARATORS: Record<SortId, (a: AdminProductRow, b: AdminProductRow) => number> = {
  "name-asc": byName,
  "name-desc": (a, b) => byName(b, a),
  "price-asc": (a, b) => Number(a.sale_price) - Number(b.sale_price) || byName(a, b),
  "price-desc": (a, b) => Number(b.sale_price) - Number(a.sale_price) || byName(a, b),
  "stock-available": (a, b) => STOCK_RANK[a.stock_status] - STOCK_RANK[b.stock_status] || byName(a, b),
  "stock-out": (a, b) => STOCK_RANK[b.stock_status] - STOCK_RANK[a.stock_status] || byName(a, b),
  newest: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || byName(a, b),
};

function InactiveBadge() {
  return (
    <span className="ml-2 inline-block rounded-full bg-black/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-black/70">
      Inactiva
    </span>
  );
}

/** Inventario: búsqueda en tiempo real (nombre o SKU), orden y «Filtros avanzados» (estado, precio, ABV, país y cervecería). */
export default function ProductList({ products }: { products: AdminProductRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortId>("name-asc");
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        if (status === "active" && !product.is_active) return false;
        if (status === "inactive" && product.is_active) return false;
        if (!matchesFilters(product, filters)) return false;
        const haystack = normalize(`${product.name} ${product.sku}`);
        return words.every((word) => haystack.includes(word));
      })
      .sort(COMPARATORS[sort]);
  }, [products, search, status, filters, sort]);

  const activeCount = activeFilterCount(filters) + (status !== "all" ? 1 : 0);
  const chips = [
    ...(status !== "all"
      ? [{ key: "status", label: STATUS_OPTIONS.find((o) => o.id === status)!.label, clear: () => setStatus("all") }]
      : []),
    ...activeFilterChips(filters, setFilters),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-full flex-1 md:min-w-0">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar productos por nombre o SKU"
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
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-card md:w-52 md:flex-none"
        >
          <SlidersHorizontal size={16} />
          Filtros avanzados
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={visible.length}
        noun={["producto", "productos"]}
      >
        <div className="space-y-4">
          <FilterSection title="Estado">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={status === option.id}
                  onClick={() => setStatus(option.id)}
                  className={chipClass(status === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterSection>
          <FilterPanel products={products} filters={filters} setFilters={setFilters} />
        </div>
      </FilterDrawer>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm text-muted" aria-live="polite">
          {visible.length} de {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
        {chips.map((chip) => (
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
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setFilters(EMPTY_FILTERS);
            }}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          No hay productos que coincidan con los filtros.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <li
              key={product.id}
              className={`space-y-3 rounded-[28px] p-4 shadow-card ${product.is_active ? "bg-white" : "bg-white/70"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex min-w-0 flex-1 items-center gap-3 ${product.is_active ? "" : "opacity-60"}`}>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt=""
                        fill
                        sizes="64px"
                        className={`object-contain p-1 ${STOCK_TAG_CLASS[product.stock_status] ? "opacity-50" : ""}`}
                      />
                    ) : (
                      <ProductPlaceholder iconClassName="h-8 w-8" />
                    )}
                    {STOCK_TAG_CLASS[product.stock_status] && (
                      <span className={`absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] font-bold uppercase leading-tight ${STOCK_TAG_CLASS[product.stock_status]}`}>
                        {STOCK_STATUS_LABEL[product.stock_status]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">
                      {product.name}
                      {!product.is_active && <InactiveBadge />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {product.country} · {product.style}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {product.sku} · {STOCK_STATUS_LABEL[product.stock_status]}
                    </p>
                  </div>
                </div>
                <FeaturedToggle id={product.id} name={product.name} isFeatured={product.is_featured} />
              </div>
              <div className="flex items-baseline justify-between px-1 text-sm">
                <span className="text-muted">
                  Costo <span className="tabular-nums">{formatMXN(Number(product.cost_price))}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatMXN(Number(product.sale_price))}</span>
              </div>
              <ProductRowActions id={product.id} name={product.name} isActive={product.is_active} layout="card" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
