"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { contarPorEnviar } from "@/app/actions/admin-pedido-edicion";

type Item = { href: string; label: string };

const GRUPOS: { titulo: string; items: Item[] }[] = [
  {
    titulo: "Ventas",
    items: [
      { href: "/admin/pedidos", label: "Pedidos" },
      { href: "/admin/clientes", label: "Clientes" },
      { href: "/admin/cupones", label: "Cupones" },
    ],
  },
  {
    titulo: "Catálogo",
    items: [
      { href: "/admin", label: "Inventario" },
      { href: "/admin/carga-masiva", label: "Carga masiva" },
    ],
  },
  {
    titulo: "Contenido",
    items: [
      { href: "/admin/landing", label: "Landing" },
      { href: "/admin/redes", label: "Redes" },
    ],
  },
  { titulo: "Análisis", items: [{ href: "/admin/resumen", label: "Resumen" }] },
];

const INTERVALO_MS = 60_000;

function esActual(href: string, pathname: string) {
  return href === "/admin" ? pathname === href || pathname.startsWith("/admin/productos") : pathname.startsWith(href);
}

/**
 * Navegación del panel, agrupada como el footer. En PC, grupos con título; en celular, una barra que se
 * desliza con objetivos de 44 px. El contador «por enviar» se vuelve a consultar al cambiar de sección,
 * al volver a la pestaña y cada 60 s (el layout no se vuelve a pintar al navegar, por eso se quedaba viejo).
 */
export default function AdminNav({ porEnviar: inicial = 0, pendientes = 0 }: { porEnviar?: number; pendientes?: number }) {
  const pathname = usePathname();
  const [porEnviar, setPorEnviar] = useState(inicial);
  // Si el layout manda un valor nuevo (p. ej. tras refresh()), manda sobre el anterior.
  const [inicialPrevio, setInicialPrevio] = useState(inicial);
  if (inicial !== inicialPrevio) {
    setInicialPrevio(inicial);
    setPorEnviar(inicial);
  }
  const barra = useRef<HTMLDivElement>(null);

  const actualizar = useCallback(async () => {
    try {
      setPorEnviar(await contarPorEnviar());
    } catch {
      // Sin red o sesión vencida: se queda el último valor.
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(actualizar, 0);
    return () => window.clearTimeout(t);
  }, [pathname, actualizar]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void actualizar();
    }, INTERVALO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") void actualizar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [actualizar]);

  // En celular, la sección actual queda a la vista dentro de la barra deslizable.
  useEffect(() => {
    const el = barra.current;
    const actual = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !actual || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = actual.offsetLeft - el.clientWidth / 2 + actual.offsetWidth / 2;
  }, [pathname]);

  return (
    <nav aria-label="Secciones del panel" className="min-w-0 flex-1">
      <div
        ref={barra}
        className="-mx-4 flex snap-x items-stretch gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:gap-x-8 lg:gap-y-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {GRUPOS.map((grupo, i) => (
          <div key={grupo.titulo} className={`flex shrink-0 items-center gap-1 lg:block ${i > 0 ? "border-l border-black/10 pl-2 lg:border-0 lg:pl-0" : ""}`}>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted lg:mb-1 lg:px-4">{grupo.titulo}</p>
            <ul className="flex items-center gap-1">
              {grupo.items.map(({ href, label }) => {
                const current = esActual(href, pathname);
                return (
                  <li key={href} className="flex snap-start items-center gap-1">
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                        current ? "bg-black text-white" : "text-black/70 hover:bg-black/10 hover:text-black"
                      }`}
                    >
                      {label}
                      {href === "/admin/pedidos" && porEnviar > 0 && (
                        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white" title={`${porEnviar} por enviar`}>
                          {porEnviar}
                          <span className="sr-only"> por enviar</span>
                        </span>
                      )}
                    </Link>
                    {href === "/admin" && pendientes > 0 && (
                      <Link
                        href="/admin?estado=pending"
                        className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-danger px-3 text-xs font-bold text-white"
                        title="Cervezas nuevas ocultas hasta que las actives"
                      >
                        {pendientes} sin activar
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
