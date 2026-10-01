"use client";

import { useEffect, useRef } from "react";
import Form from "next/form";
import { Search } from "lucide-react";
import { SEARCH_PARAM } from "@/lib/catalog-filters";

export const MOBILE_SEARCH_ID = "mobile-search-bar";

/** Barra de búsqueda desplegable del header móvil: toma el foco al abrirse y se cierra con Escape o al buscar. */
export default function MobileSearchBar({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Form
      id={MOBILE_SEARCH_ID}
      action="/"
      role="search"
      onSubmit={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="relative mx-auto mt-2 max-w-6xl md:hidden"
    >
      <Search size={17} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <label htmlFor="mobile-search-input" className="sr-only">
        Buscar cervezas
      </label>
      <input
        ref={inputRef}
        id="mobile-search-input"
        type="search"
        name={SEARCH_PARAM}
        placeholder="Busca una cerveza"
        enterKeyHint="search"
        className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-base shadow-card outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
      />
    </Form>
  );
}
