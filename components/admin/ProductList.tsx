"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { normalize } from "@/lib/catalog-filters";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";
import ProductRowActions from "./ProductRowActions";

export type AdminProductRow = {
  id: string;
  sku: string;
  name: string;
  country: string;
  style: string;
  cost_price: number;
  sale_price: number;
  stock_status: StockStatus;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

const STATUS_OPTIONS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Solo activas" },
  { id: "inactive", label: "Solo inactivas" },
] as const;

const SORT_OPTIONS = [
  { id: "name-asc", label: "Nombre (A-Z)" },
  { id: "name-desc", label: "Nombre (Z-A)" },
  { id: "price-asc", label: "Precio (menor a mayor)" },
  { id: "price-desc", label: "Precio (mayor a menor)" },
  { id: "stock-asc", label: "Stock (menor a mayor)" },
  { id: "stock-desc", label: "Stock (mayor a menor)" },
  { id: "newest", label: "Más recientes" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["id"];
type SortId = (typeof SORT_OPTIONS)[number]["id"];

/** El stock es un estado, no una cantidad: se ordena de lo más urgente (agotada) a lo más holgado. */
const STOCK_RANK: Record<StockStatus, number> = { out_of_stock: 0, low_stock: 1, preorder: 2, in_stock: 3 };

const byName = (a: AdminProductRow, b: AdminProductRow) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });

const COMPARATORS: Record<SortId, (a: AdminProductRow, b: AdminProductRow) => number> = {
  "name-asc": byName,
  "name-desc": (a, b) => byName(b, a),
  "price-asc": (a, b) => Number(a.sale_price) - Number(b.sale_price) || byName(a, b),
  "price-desc": (a, b) => Number(b.sale_price) - Number(a.sale_price) || byName(a, b),
  "stock-asc": (a, b) => STOCK_RANK[a.stock_status] - STOCK_RANK[b.stock_status] || byName(a, b),
  "stock-desc": (a, b) => STOCK_RANK[b.stock_status] - STOCK_RANK[a.stock_status] || byName(a, b),
  newest: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || byName(a, b),
};

const selectClass =
  "min-h-11 w-full cursor-pointer rounded-full bg-white px-4 text-sm font-semibold shadow-card outline-none focus:ring-2 focus:ring-black/15";

function InactiveBadge() {
  return (
    <span className="ml-2 inline-block rounded-full bg-black/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-black/70">
      Inactiva
    </span>
  );
}

/** Lista del inventario con búsqueda en tiempo real (nombre o SKU), filtro por estado y orden. */
export default function ProductList({ products }: { products: AdminProductRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortId>("name-asc");

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        if (status === "active" && !product.is_active) return false;
        if (status === "inactive" && product.is_active) return false;
        const haystack = normalize(`${product.name} ${product.sku}`);
        return words.every((word) => haystack.includes(word));
      })
      .sort(COMPARATORS[sort]);
  }, [products, search, status, sort]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar productos por nombre o SKU"
            className="min-h-11 w-full rounded-full bg-white py-3 pl-10 pr-5 text-sm shadow-card outline-none focus:ring-2 focus:ring-black/15"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filtrar por estado"
          className={`${selectClass} sm:w-44`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          aria-label="Ordenar por"
          className={`${selectClass} sm:w-60`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              Ordenar: {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {visible.length} de {products.length} {products.length === 1 ? "producto" : "productos"}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          No hay productos que coincidan con los filtros.
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {visible.map((product) => (
              <li
                key={product.id}
                className={`space-y-3 rounded-[28px] bg-white p-4 shadow-card ${product.is_active ? "" : "bg-white/70"}`}
              >
                <div className={`flex items-center gap-3 ${product.is_active ? "" : "opacity-60"}`}>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                    {product.image_url && (
                      <Image src={product.image_url} alt="" fill sizes="64px" className="object-contain p-1" />
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

          <div className="hidden overflow-hidden rounded-[28px] bg-white shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="sticky left-0 z-20 w-[11.5rem] bg-white px-4 py-4">Acciones</th>
                    <th className="sticky left-[11.5rem] z-20 min-w-[16rem] border-r border-black/5 bg-white px-4 py-4">
                      Cerveza
                    </th>
                    <th className="px-4 py-4">Estilo</th>
                    <th className="px-4 py-4">Disponibilidad</th>
                    <th className="px-4 py-4 text-right">Costo</th>
                    <th className="px-4 py-4 text-right">Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => {
                    const dim = product.is_active ? "" : "opacity-60";
                    return (
                      <tr key={product.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                        <td className="sticky left-0 z-10 w-[11.5rem] bg-white px-4 py-3">
                          <ProductRowActions id={product.id} name={product.name} isActive={product.is_active} layout="row" />
                        </td>
                        <td className="sticky left-[11.5rem] z-10 min-w-[16rem] border-r border-black/5 bg-white px-4 py-3">
                          <div className={`flex items-center gap-3 ${dim}`}>
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white">
                              {product.image_url && (
                                <Image src={product.image_url} alt="" fill sizes="44px" className="object-contain p-1" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {product.name}
                                {!product.is_active && <InactiveBadge />}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {product.country} · {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-black/60 ${dim}`}>{product.style}</td>
                        <td className={`px-4 py-3 text-black/60 ${dim}`}>{STOCK_STATUS_LABEL[product.stock_status]}</td>
                        <td className={`px-4 py-3 text-right tabular-nums text-black/60 ${dim}`}>
                          {formatMXN(Number(product.cost_price))}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${dim}`}>
                          {formatMXN(Number(product.sale_price))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
