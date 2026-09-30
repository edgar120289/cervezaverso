"use client";

import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SEARCH_PARAM } from "@/lib/catalog-filters";

/**
 * Buscador del header (escritorio): envía `/?q=…` y el catálogo de la portada
 * aplica el texto con sus filtros. En móvil la búsqueda vive en el menú hamburguesa.
 */
export default function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = pathname === "/" ? (searchParams.get(SEARCH_PARAM) ?? "") : "";

  return (
    <Form action="/" scroll={false} role="search" className="relative w-full max-w-xs">
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
        className="w-full rounded-full bg-canvas py-2.5 pl-10 pr-4 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
      />
    </Form>
  );
}
