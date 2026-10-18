"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { COUNTRY_CATEGORIES, STYLE_CATEGORIES } from "@/lib/seo-categories";

const LINK_CLASS =
  "rounded-full bg-canvas px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-black hover:text-white";

/** Botón «Categorías» del catálogo: despliega los enlaces a las páginas por país y por estilo. */
export default function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 md:w-48 md:flex-none">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-semibold shadow-card outline-none focus-visible:ring-2 focus-visible:ring-black/15 sm:px-4"
      >
        <LayoutGrid size={16} aria-hidden className="hidden sm:block" />
        Categorías
        <ChevronDown size={16} aria-hidden className={`hidden transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-14 z-30 w-[calc(100vw-2rem)] max-w-md space-y-5 rounded-[28px] bg-white p-5 shadow-card ring-1 ring-black/5 md:w-[28rem]"
        >
          <section aria-labelledby={`${panelId}-paises`}>
            <h2 id={`${panelId}-paises`} className="mb-2 text-sm font-semibold text-muted">
              Países destacados
            </h2>
            <ul className="flex flex-wrap gap-2">
              {COUNTRY_CATEGORIES.map((country) => (
                <li key={country.slug}>
                  <Link href={`/catalogo/pais/${country.slug}`} onClick={() => setOpen(false)} className={LINK_CLASS}>
                    {country.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby={`${panelId}-estilos`}>
            <h2 id={`${panelId}-estilos`} className="mb-2 text-sm font-semibold text-muted">
              Estilos populares
            </h2>
            <ul className="flex flex-wrap gap-2">
              {STYLE_CATEGORIES.map((style) => (
                <li key={style.slug}>
                  <Link href={`/catalogo/estilo/${style.slug}`} onClick={() => setOpen(false)} className={LINK_CLASS}>
                    {style.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
