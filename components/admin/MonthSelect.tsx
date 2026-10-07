"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { MesOpcion } from "@/lib/admin-analytics";

/** Selector de mes del Resumen: la URL (`?mes=2026-09`) es la fuente de verdad y el servidor recalcula. */
export default function MonthSelect({ value, options }: { value: string; options: MesOpcion[] }) {
  const router = useRouter();

  return (
    <label className="relative block w-full sm:w-64">
      <span className="sr-only">Mes de ventas</span>
      <CalendarDays size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <select
        value={value}
        onChange={(e) => router.replace(`/admin/resumen?mes=${e.target.value}`, { scroll: false })}
        className="h-12 w-full appearance-none rounded-full bg-white pl-10 pr-10 text-sm font-semibold shadow-card"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
    </label>
  );
}
