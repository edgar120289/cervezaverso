"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/landing", label: "Landing" },
  { href: "/admin/carga-masiva", label: "Carga masiva" },
] as const;

/** Navegación del panel: enlaces tipo píldora, con la sección actual resaltada. */
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1.5">
      {LINKS.map(({ href, label }) => {
        const current = (href === "/admin" ? pathname === href : pathname.startsWith(href));
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
          </Link>
        );
      })}
    </nav>
  );
}
