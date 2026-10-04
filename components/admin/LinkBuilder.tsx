"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { buscarProductosActivos, type ProductOption } from "@/app/actions/admin-landing";

/** Páginas internas que se pueden enlazar desde un botón. */
export const INTERNAL_PAGES = [
  { url: "/tienda", label: "Tienda" },
  { url: "/#contacto", label: "Contacto (en la portada)" },
  { url: "/carrito", label: "Carrito" },
] as const;

const PRODUCT_PREFIX = "/cervezas/";

type Mode = "internal" | "product" | "external";

export type LinkValue = { url: string; is_external: boolean };

type LinkBuilderProps = {
  /** Nombre accesible del grupo (por ejemplo, "Banner 2: botón 1"). */
  label: string;
  value: LinkValue;
  onChange: (value: LinkValue) => void;
};

const fieldClass = "min-h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

function modeOf(value: LinkValue): Mode {
  if (value.is_external) return "external";
  return value.url.startsWith(PRODUCT_PREFIX) ? "product" : "internal";
}

/**
 * Selector de destino de un botón con 3 modos: página interna (lista fija), cerveza específica
 * (búsqueda en el servidor, solo productos activos) y enlace externo (se abre en pestaña nueva).
 */
export default function LinkBuilder({ label, value, onChange }: LinkBuilderProps) {
  const [mode, setMode] = useState<Mode>(() => modeOf(value));

  function changeMode(next: Mode) {
    setMode(next);
    if (next === "internal") onChange({ url: INTERNAL_PAGES[0].url, is_external: false });
    else onChange({ url: "", is_external: next === "external" });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr]">
      <select
        value={mode}
        onChange={(e) => changeMode(e.target.value as Mode)}
        aria-label={`${label}: tipo de destino`}
        className={fieldClass}
      >
        <option value="internal">Página interna</option>
        <option value="product">Cerveza específica</option>
        <option value="external">Enlace externo</option>
      </select>

      {mode === "internal" && (
        <select
          value={value.url}
          onChange={(e) => onChange({ url: e.target.value, is_external: false })}
          aria-label={`${label}: página`}
          className={fieldClass}
        >
          {!INTERNAL_PAGES.some((page) => page.url === value.url) && (
            <option value={value.url}>{value.url || "Elige una página"}</option>
          )}
          {INTERNAL_PAGES.map((page) => (
            <option key={page.url} value={page.url}>
              {page.label} ({page.url})
            </option>
          ))}
        </select>
      )}

      {mode === "product" && (
        <ProductPicker
          label={label}
          sku={value.url.slice(PRODUCT_PREFIX.length)}
          onPick={(sku) => onChange({ url: sku ? `${PRODUCT_PREFIX}${sku}` : "", is_external: false })}
        />
      )}

      {mode === "external" && (
        <input
          type="text"
          inputMode="url"
          value={value.url}
          maxLength={500}
          onChange={(e) => onChange({ url: e.target.value, is_external: true })}
          placeholder="https://wa.me/52… o https://…"
          aria-label={`${label}: enlace externo`}
          className={fieldClass}
        />
      )}
    </div>
  );
}

function ProductPicker({ label, sku, onPick }: { label: string; sku: string; onPick: (sku: string) => void }) {
  const listId = useId();
  const [name, setName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Con una cerveza ya elegida, se resuelve su nombre una sola vez (la búsqueda por SKU la encuentra).
  useEffect(() => {
    if (!sku) return;
    let cancelled = false;
    buscarProductosActivos(sku).then((found) => {
      if (!cancelled) setName(found.find((item) => item.sku === sku)?.name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [sku]);

  // Búsqueda con espera: una consulta al servidor cuando el admin deja de escribir.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const current = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const found = await buscarProductosActivos(query);
      if (current === requestId.current) {
        setResults(found);
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  function handleQuery(next: string) {
    setQuery(next);
    if (next.trim().length < 2) {
      requestId.current++;
      setResults([]);
      setLoading(false);
    }
  }

  if (sku) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-2 rounded-full bg-canvas pl-4 pr-1 text-sm">
        <span className="min-w-0 truncate">
          <span className="font-semibold">{name ?? sku}</span>
          {name && <span className="text-muted"> · {sku}</span>}
        </span>
        <button
          type="button"
          onClick={() => {
            setName(null);
            setQuery("");
            setResults([]);
            onPick("");
          }}
          className="min-h-11 shrink-0 rounded-full px-3 text-xs font-semibold hover:bg-black hover:text-white"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search size={16} aria-hidden className="pointer-events-none absolute left-4 top-[22px] -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => handleQuery(e.target.value)}
        placeholder="Busca una cerveza por nombre o SKU"
        aria-label={`${label}: buscar cerveza`}
        aria-controls={listId}
        className={`${fieldClass} pl-10`}
      />
      {loading && <Loader2 size={16} aria-hidden className="absolute right-4 top-[22px] -translate-y-1/2 animate-spin text-muted" />}
      <ul id={listId} aria-live="polite" className="mt-1 space-y-1">
        {results.map((item) => (
          <li key={item.sku}>
            <button
              type="button"
              onClick={() => onPick(item.sku)}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl bg-canvas px-4 text-left text-sm hover:bg-black hover:text-white"
            >
              <span className="min-w-0 truncate font-semibold">{item.name}</span>
              <span className="shrink-0 text-xs opacity-70">{item.sku}</span>
            </button>
          </li>
        ))}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <li className="px-4 py-2 text-xs text-muted">Sin cervezas activas con ese nombre o SKU.</li>
        )}
      </ul>
    </div>
  );
}
