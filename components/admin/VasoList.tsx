"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ChevronDown, Filter, Loader2, Search } from "lucide-react";
import { cambiarVaso } from "@/app/actions/admin-vasos";
import { normalize } from "@/lib/catalog-filters";
import { normalCase } from "@/lib/text-case";
import { isVasoCode, VASO_CODES, VASOS, vasoNombre, type VasoCode } from "@/lib/vasos";
import CountryFlag from "@/components/CountryFlag";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import VasoIcon from "./VasoIcon";

export type VasoRow = {
  id: string;
  name: string;
  country: string;
  style: string;
  image_url: string | null;
  vaso: string | null;
  vaso_origen: string | null;
};

/** «all», «none» (sin asignar), «manual» (cambiadas a mano) o un código de vaso. */
type VasoFilter = "all" | "none" | "manual" | VasoCode;

/** Vasos ordenados por nombre en español para los selectores. */
const VASOS_POR_NOMBRE = [...VASO_CODES].sort((a, b) => VASOS[a].nombre.localeCompare(VASOS[b].nombre, "es"));

const SELECT_CLASS =
  "h-12 w-full cursor-pointer appearance-none truncate rounded-full bg-white pl-10 pr-10 text-sm font-semibold shadow-card outline-none focus:ring-2 focus:ring-black/15";

function Counter({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col rounded-[28px] bg-white px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {/* mt-auto: el número queda abajo aunque la etiqueta ocupe dos líneas en celular. */}
      <p className={`mt-auto pt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** Una cerveza: foto, datos y selector de vaso que guarda al instante como 'manual'. */
function VasoItem({ row }: { row: VasoRow }) {
  const saved = isVasoCode(row.vaso) ? row.vaso : null;
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const name = normalCase(row.name);
  const selectId = `vaso-${row.id}`;

  function handleChange(value: string) {
    const next = isVasoCode(value) ? value : null;
    setStatus(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await cambiarVaso(row.id, next);
      setStatus(result.ok ? { ok: true, message: "Guardado" } : { ok: false, message: result.error });
    });
  }

  return (
    <li className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-[28px] bg-white p-4 shadow-card md:grid-cols-[64px_minmax(0,1fr)_minmax(0,300px)] md:gap-x-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white">
        {row.image_url ? (
          <Image src={row.image_url} alt="" fill sizes="64px" className="object-contain p-1" />
        ) : (
          <ProductPlaceholder iconClassName="h-8 w-8" />
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold leading-snug">{name}</p>
        <p className="mt-1 flex min-w-0 items-start gap-1.5 text-xs leading-[15px] text-muted">
          <CountryFlag country={row.country} />
          <span className="min-w-0 break-words">
            {normalCase(row.country)} · {normalCase(row.style)}
          </span>
        </p>
      </div>

      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            optimistic ? "bg-canvas text-black" : "bg-amber-100 text-amber-800"
          }`}
        >
          <VasoIcon code={optimistic} className="h-8 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor={selectId} className="sr-only">
            Vaso de {name}
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={optimistic ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isPending}
              className="h-11 w-full cursor-pointer appearance-none truncate rounded-full bg-canvas pl-4 pr-10 text-sm font-semibold outline-none focus:ring-2 focus:ring-black/15 disabled:cursor-wait disabled:opacity-70"
            >
              <option value="">Sin asignar</option>
              {VASOS_POR_NOMBRE.map((code) => (
                <option key={code} value={code}>
                  {VASOS[code].nombre}
                </option>
              ))}
            </select>
            {isPending ? (
              <Loader2 size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin" />
            ) : (
              <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <p className="mt-1 min-h-4 px-4 text-[11px] leading-4" aria-live="polite">
            {status ? (
              <span className={status.ok ? "inline-flex items-center gap-1 font-semibold text-emerald-700" : "font-semibold text-danger"}>
                {status.ok && <Check size={12} aria-hidden />}
                {status.message}
              </span>
            ) : (
              <span className="text-muted">
                {row.vaso_origen === "manual" ? "Elegido a mano" : row.vaso_origen === "auto" ? "Asignado por regla" : "Pendiente de decidir"}
              </span>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}

/** Vasos: contadores, buscador, filtro por vaso y lista de cervezas activas con su selector. */
export default function VasoList({ rows }: { rows: VasoRow[] }) {
  const [filter, setFilter] = useState<VasoFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const byVaso = new Map<VasoCode, number>();
    let none = 0;
    let manual = 0;
    for (const row of rows) {
      if (isVasoCode(row.vaso)) byVaso.set(row.vaso, (byVaso.get(row.vaso) ?? 0) + 1);
      else none++;
      if (row.vaso_origen === "manual") manual++;
    }
    return { byVaso, none, manual };
  }, [rows]);

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    return rows.filter((row) => {
      if (filter === "none" && isVasoCode(row.vaso)) return false;
      if (filter === "manual" && row.vaso_origen !== "manual") return false;
      if (isVasoCode(filter) && row.vaso !== filter) return false;
      const haystack = normalize(`${row.name} ${row.style} ${row.country}`);
      return words.every((word) => haystack.includes(word));
    });
  }, [rows, filter, search]);

  const filterLabel =
    filter === "all" ? "Todos" : filter === "none" ? "Sin asignar" : filter === "manual" ? "Cambiadas a mano" : vasoNombre(filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Counter label="Total" value={rows.length} />
        <Counter label="Asignadas" value={rows.length - counts.none} />
        <Counter label="Sin asignar" value={counts.none} tone={counts.none > 0 ? "text-amber-700" : ""} />
        <Counter label="Cambiadas a mano" value={counts.manual} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className="relative min-w-0 md:flex-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, estilo o país"
            aria-label="Buscar cervezas por nombre, estilo o país"
            className="h-12 w-full rounded-full bg-white pl-11 pr-5 text-sm shadow-card outline-none focus:ring-2 focus:ring-black/15"
          />
        </div>
        <div className="relative min-w-0 md:w-80">
          <Filter size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as VasoFilter)}
            aria-label="Filtrar por vaso"
            className={SELECT_CLASS}
          >
            <option value="all">Todos ({rows.length})</option>
            <option value="none">Sin asignar ({counts.none})</option>
            <option value="manual">Cambiadas a mano ({counts.manual})</option>
            <optgroup label="Por tipo de vaso">
              {VASOS_POR_NOMBRE.map((code) => (
                <option key={code} value={code}>
                  {VASOS[code].nombre} ({counts.byVaso.get(code) ?? 0})
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {visible.length} de {rows.length} {rows.length === 1 ? "cerveza" : "cervezas"} · {filterLabel}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          {filter === "none" && !search ? "Todas las cervezas activas ya tienen vaso." : "No hay cervezas que coincidan con el filtro."}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:gap-4">
          {visible.map((row) => (
            <VasoItem key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
