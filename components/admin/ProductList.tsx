"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, CircleAlert, Eye, Loader2, Search, SlidersHorizontal, Sparkles, Star, X } from "lucide-react";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  matchesFilters,
  normalize,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import {
  parseListState,
  serializeListState,
  type AdminSortId,
  type MissingFilter,
  type StatusFilter,
} from "@/lib/admin-list-url";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
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
  retirado: boolean;
  pendiente: boolean;
  notas_perfil: string | null;
};

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Solo activas" },
  { id: "inactive", label: "Solo inactivas" },
  { id: "pending", label: "Pendientes" },
  { id: "retired", label: "Retiradas" },
];

/** El interruptor rápido recorre los tres estados: todas → solo activas → solo inactivas → todas. */
const NEXT_STATUS: Record<StatusFilter, StatusFilter> = {
  all: "active",
  active: "inactive",
  inactive: "all",
  pending: "all",
  retired: "all",
};

const TOGGLE_CLASS =
  "flex h-12 min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-card transition-colors lg:w-40 lg:flex-none lg:basis-auto";

const SORT_OPTIONS = [
  { id: "name-asc", label: "Nombre A-Z" },
  { id: "name-desc", label: "Nombre Z-A" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "stock-available", label: "Stock: disponibles" },
  { id: "stock-out", label: "Stock: agotadas" },
  { id: "newest", label: "Más recientes" },
] as const;

type SortId = AdminSortId;

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

function StatusBadge({ product }: { product: AdminProductRow }) {
  if (product.is_active) return null;
  const [label, tone] = product.retirado
    ? ["Retirada", "bg-red-900 text-white"]
    : product.pendiente
      ? ["Pendiente", "bg-amber-400 text-black"]
      : ["Inactiva", "bg-black/10 text-black/70"];
  return (
    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ${tone}`}>
      {label}
    </span>
  );
}

/** Lo que le falta a una cerveza para estar completa (foto, cervecería y notas de cata). */
function missingFields(product: AdminProductRow): MissingFilter[] {
  const missing: MissingFilter[] = [];
  if (!product.image_url) missing.push("photo");
  if (!product.brewery?.trim()) missing.push("brewery");
  if (!product.notas_perfil?.trim()) missing.push("notes");
  return missing;
}

const MISSING_LABEL: Record<MissingFilter, string> = {
  any: "Incompletas",
  photo: "foto",
  brewery: "cervecería",
  notes: "notas de cata",
};

const MISSING_OPTIONS: { id: MissingFilter; label: string }[] = [
  { id: "any", label: "Cualquier dato" },
  { id: "brewery", label: "Sin cervecería" },
  { id: "photo", label: "Sin foto" },
  { id: "notes", label: "Sin notas de cata" },
];

function matchesMissing(product: AdminProductRow, missing: MissingFilter | null): boolean {
  if (!missing) return true;
  const fields = missingFields(product);
  return missing === "any" ? fields.length > 0 : fields.includes(missing);
}

/** Notas con IA en lote: el navegador pide una ficha a la vez (dos en paralelo) y cada una se guarda sola. */
const AI_CONCURRENCY = 2;

/** Inventario: búsqueda en tiempo real (nombre o SKU), orden y «Filtros avanzados» (estado, precio, ABV, país y cervecería). */
export default function ProductList({ products }: { products: AdminProductRow[] }) {
  // La URL es la memoria del listado: se lee una vez al montar y cada cambio se refleja con replaceState.
  const searchParams = useSearchParams();
  const [initial] = useState(() => parseListState(searchParams));
  const [search, setSearch] = useState(initial.search);
  const [status, setStatus] = useState<StatusFilter>(initial.status);
  const [sort, setSort] = useState<SortId>(initial.sort);
  const [featuredOnly, setFeaturedOnly] = useState(initial.featuredOnly);
  const [missing, setMissing] = useState<MissingFilter | null>(initial.missing);
  const router = useRouter();
  const [aiPanel, setAiPanel] = useState(false);
  const [aiRun, setAiRun] = useState<{ done: number; total: number; failed: number; error: string | null; running: boolean } | null>(null);
  const cancelAi = useRef(false);
  const [filters, setFilters] = useState<CatalogFilters>(initial.filters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // replaceState (no push) deja una sola entrada de historial; con espera para no saturarlo al teclear.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = serializeListState({ search, status, sort, featuredOnly, missing, filters });
      if (query === window.location.search.replace(/^\?/, "")) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, status, sort, featuredOnly, missing, filters]);

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        if (status === "active" && !product.is_active) return false;
        if (status === "inactive" && product.is_active) return false;
        if (status === "pending" && !(product.pendiente && !product.is_active)) return false;
        if (status === "retired" && !product.retirado) return false;
        if (featuredOnly && !product.is_featured) return false;
        if (!matchesMissing(product, missing)) return false;
        if (!matchesFilters(product, filters)) return false;
        const haystack = normalize(`${product.name} ${product.sku}`);
        return words.every((word) => haystack.includes(word));
      })
      .sort(COMPARATORS[sort]);
  }, [products, search, status, featuredOnly, missing, filters, sort]);

  // Las retiradas no cuentan: no se van a vender.
  const incompleteCount = useMemo(
    () => products.filter((product) => !product.retirado && missingFields(product).length > 0).length,
    [products],
  );
  const withoutNotes = visible.filter((product) => !product.notas_perfil?.trim());

  async function runAi(targets: AdminProductRow[]) {
    if (targets.length === 0) return;
    cancelAi.current = false;
    setAiRun({ done: 0, total: targets.length, failed: 0, error: null, running: true });
    let next = 0;
    const worker = async () => {
      while (next < targets.length && !cancelAi.current) {
        const product = targets[next++];
        try {
          const enrich = () =>
            fetch("/api/ai/enrich", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product_id: product.id }),
            });
          let res = await enrich();
          // Gemini saturado o tiempo agotado: un segundo intento tras una pausa suele salir.
          if (res.status >= 500 && !cancelAi.current) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            res = await enrich();
          }
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const error = res.status === 504 ? "La IA tardó demasiado (servicio saturado)." : (data.error ?? "Error");
            setAiRun((run) => run && { ...run, done: run.done + 1, failed: run.failed + 1, error });
            // Sesión vencida o sin permiso: no tiene caso seguir.
            if (res.status === 401 || res.status === 403) cancelAi.current = true;
            continue;
          }
          setAiRun((run) => run && { ...run, done: run.done + 1 });
        } catch {
          setAiRun((run) => run && { ...run, done: run.done + 1, failed: run.failed + 1, error: "Sin conexión." });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(AI_CONCURRENCY, targets.length) }, worker));
    setAiRun((run) => run && { ...run, running: false });
    router.refresh();
  }

  const activeCount =
    activeFilterCount(filters) + (status !== "all" ? 1 : 0) + (featuredOnly ? 1 : 0) + (missing ? 1 : 0);
  const chips = [
    ...(status !== "all"
      ? [{ key: "status", label: STATUS_OPTIONS.find((o) => o.id === status)!.label, clear: () => setStatus("all") }]
      : []),
    ...(featuredOnly ? [{ key: "featured", label: "Destacadas", clear: () => setFeaturedOnly(false) }] : []),
    ...(missing
      ? [
          {
            key: "missing",
            label: missing === "any" ? "Incompletas" : `Sin ${MISSING_LABEL[missing]}`,
            clear: () => setMissing(null),
          },
        ]
      : []),
    ...activeFilterChips(filters, setFilters),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-full flex-1 lg:min-w-0">
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
        <div className="relative min-w-0 flex-1 basis-[calc(50%-0.5rem)] lg:w-44 lg:flex-none lg:basis-auto">
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
          className="flex h-12 min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-card lg:w-48 lg:flex-none lg:basis-auto"
        >
          <SlidersHorizontal size={16} />
          Filtros avanzados
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setStatus(NEXT_STATUS[status])}
          aria-label={`Estado: ${STATUS_OPTIONS.find((o) => o.id === status)!.label}. Cambiar`}
          className={`${TOGGLE_CLASS} ${status === "all" ? "bg-white" : "bg-black text-white"}`}
        >
          <Eye size={16} aria-hidden className="shrink-0" />
          <span className="truncate">{STATUS_OPTIONS.find((o) => o.id === status)!.label}</span>
        </button>
        <button
          type="button"
          onClick={() => setFeaturedOnly((on) => !on)}
          aria-pressed={featuredOnly}
          className={`${TOGGLE_CLASS} ${featuredOnly ? "bg-black text-white" : "bg-white"}`}
        >
          <Star size={16} aria-hidden className={`shrink-0 ${featuredOnly ? "fill-current" : ""}`} />
          <span className="truncate">Destacadas</span>
        </button>
        <button
          type="button"
          onClick={() => setMissing((current) => (current ? null : "any"))}
          aria-pressed={missing !== null}
          className={`${TOGGLE_CLASS} ${missing ? "bg-black text-white" : "bg-white"}`}
        >
          <CircleAlert size={16} aria-hidden className="shrink-0" />
          <span className="truncate">Incompletas ({incompleteCount})</span>
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
          <FilterSection title="Incompletas">
            <div className="flex flex-wrap gap-1.5">
              {MISSING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={missing === option.id}
                  onClick={() => setMissing((current) => (current === option.id ? null : option.id))}
                  className={chipClass(missing === option.id)}
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
              setFeaturedOnly(false);
              setMissing(null);
              setFilters(EMPTY_FILTERS);
            }}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Limpiar todos los filtros
          </button>
        )}
        <button
          type="button"
          onClick={() => setAiPanel((open) => !open)}
          aria-expanded={aiPanel}
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold shadow-card hover:bg-black hover:text-white"
        >
          <Sparkles size={14} aria-hidden />
          Notas con IA
        </button>
      </div>

      {(aiPanel || aiRun) && (
        <div className="space-y-3 rounded-[28px] bg-white p-4 text-sm shadow-card">
          {aiRun ? (
            <div className="flex flex-wrap items-center gap-3" aria-live="polite">
              {aiRun.running && <Loader2 size={16} className="animate-spin" aria-hidden />}
              <span className="font-semibold">
                {aiRun.running ? "Generando" : "Listo"}: {aiRun.done - aiRun.failed} de {aiRun.total}
                {aiRun.failed > 0 && <span className="text-danger"> · {aiRun.failed} con error</span>}
              </span>
              {aiRun.error && <span className="text-xs text-danger">{aiRun.error}</span>}
              {aiRun.running ? (
                <button type="button" onClick={() => (cancelAi.current = true)} className="text-xs font-semibold text-accent hover:underline">
                  Detener
                </button>
              ) : (
                <button type="button" onClick={() => setAiRun(null)} className="text-xs font-semibold text-accent hover:underline">
                  Cerrar
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-muted">
                Genera con IA el origen, el perfil, el maridaje y las descripciones cortas, y los guarda directo. Trabaja
                sobre las {visible.length} cervezas de esta vista (usa los filtros para elegirlas). Deja esta pestaña abierta
                mientras termina.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={withoutNotes.length === 0}
                  onClick={() => runAi(withoutNotes)}
                  className="min-h-11 rounded-full bg-accent px-5 font-semibold text-white shadow-accent disabled:opacity-40"
                >
                  Completar las que no tienen notas ({withoutNotes.length})
                </button>
                <button
                  type="button"
                  disabled={visible.length === 0}
                  onClick={() => {
                    if (window.confirm(`Se reemplazarán las notas de ${visible.length} cervezas. ¿Continuar?`)) runAi(visible);
                  }}
                  className="min-h-11 rounded-full bg-canvas px-5 font-semibold hover:bg-black/10 disabled:opacity-40"
                >
                  Regenerar todas las de esta vista ({visible.length})
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
                      {normalCase(product.name)}
                      <StatusBadge product={product} />
                    </p>
                    <p className="truncate text-xs text-muted">
                      {normalCase(product.country)} · {normalCase(product.style)}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {product.sku} · {STOCK_STATUS_LABEL[product.stock_status]}
                    </p>
                    {!product.retirado && missingFields(product).length > 0 && (
                      <p className="text-xs font-semibold text-amber-700">
                        Falta: {missingFields(product).map((field) => MISSING_LABEL[field]).join(", ")}
                      </p>
                    )}
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
              <ProductRowActions
                id={product.id}
                name={product.name}
                isActive={product.is_active}
                isRetired={product.retirado}
                layout="card"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
