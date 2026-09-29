"use client";

import { useEffect, useRef, useState } from "react";
import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { SEARCH_PARAM } from "@/lib/catalog-filters";

const inputClass =
  "w-full rounded-full bg-canvas py-2.5 pl-10 pr-4 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";

/**
 * Buscador del header: envía `/?q=…` y el catálogo de la portada aplica el
 * texto con sus filtros. En escritorio es un campo; en móvil, un ícono que
 * despliega el campo debajo del header.
 */
export default function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const currentQuery = pathname === "/" ? (searchParams.get(SEARCH_PARAM) ?? "") : "";

  useEffect(() => {
    if (isOpen) mobileInputRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <Form action="/" scroll={false} role="search" className="relative hidden w-full max-w-xs md:block">
        <Search size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <label htmlFor="header-search" className="sr-only">
          Buscar cervezas
        </label>
        <input
          key={currentQuery}
          id="header-search"
          type="search"
          name={SEARCH_PARAM}
          defaultValue={currentQuery}
          placeholder="Busca una cerveza"
          className={inputClass}
        />
      </Form>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Cerrar búsqueda" : "Buscar cervezas"}
        aria-expanded={isOpen}
        aria-controls="header-search-mobile"
        className="flex h-11 w-11 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5 md:hidden"
      >
        {isOpen ? <X size={20} /> : <Search size={20} />}
      </button>

      {isOpen && (
        <Form
          id="header-search-mobile"
          action="/"
          scroll={false}
          role="search"
          onSubmit={() => setIsOpen(false)}
          className="absolute inset-x-0 top-full mt-2 rounded-[28px] bg-white p-2 shadow-card md:hidden"
        >
          <div className="relative">
            <Search size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="header-search-mobile-input" className="sr-only">
              Buscar cervezas
            </label>
            <input
              ref={mobileInputRef}
              id="header-search-mobile-input"
              type="search"
              name={SEARCH_PARAM}
              defaultValue={currentQuery}
              placeholder="Nombre, estilo, país o cervecería"
              enterKeyHint="search"
              className={inputClass}
            />
          </div>
        </Form>
      )}
    </>
  );
}
