"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Inventario" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/resumen", label: "Resumen" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/landing", label: "Landing" },
  { href: "/admin/carga-masiva", label: "Carga masiva" },
  { href: "/admin/redes", label: "Redes" },
] as const;

/** Navegación del panel: enlaces tipo píldora, con la sección actual resaltada. */
export default function AdminNav({ porEnviar = 0 }: { porEnviar?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1.5">
      {LINKS.map(({ href, label }) => {
        const current =
          href === "/admin" ? pathname === href || pathname.startsWith("/admin/productos") : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
              current ? "bg-black text-white" : "text-black/70 hover:bg-black/10 hover:text-black"
            }`}
          >
            {label}
            {href === "/admin/pedidos" && porEnviar > 0 && (
              <span
                className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white"
                title={`${porEnviar} por enviar`}
              >
                {porEnviar}
                <span className="sr-only"> por enviar</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
