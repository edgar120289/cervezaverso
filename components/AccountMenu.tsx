"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, User, UserRound } from "lucide-react";
import { useAccount } from "@/lib/account-context";

/** Píldora de PC: borde del color de marca, mismo ancho mínimo con y sin sesión (no mueve el header). */
const pillClass =
  "relative flex min-h-11 min-w-[7.5rem] items-center justify-center gap-2 rounded-full border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/[0.06]";
/** Celular: solo ícono, 44 px. */
const iconClass = "relative flex h-11 w-11 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/[0.06]";

/** Punto morado: solo si hay algo nuevo (premio sin canjear o pedidos recién ligados). */
function NewsDot() {
  return <span aria-hidden className="absolute right-1 top-1 h-2.5 w-2.5 rounded-pill border-2 border-white bg-accent" />;
}

function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase text-white">
      {name.charAt(0) || "?"}
    </span>
  );
}

const ADMIN_LINKS = [{ href: "/admin", label: "Panel de Administración", icon: LayoutDashboard }];
const CLIENT_LINKS = [{ href: "/cuenta", label: "Mi cuenta", icon: UserRound }];

/**
 * Cuenta en el header. Sin sesión: «Entrar» (PC) o ícono (celular) a /login.
 * Con sesión: «Mi cuenta» con la inicial (PC) o solo la inicial (celular), con menú.
 */
export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, role, signOut, displayName, hasNews } = useAccount();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierra al navegar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  // Cierra con clic fuera o Escape.
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <Link href="/login" aria-label={compact ? "Entrar a tu cuenta" : undefined} className={compact ? iconClass : pillClass}>
        <User size={compact ? 22 : 18} aria-hidden />
        {!compact && "Entrar"}
      </Link>
    );
  }

  const links = role === "admin" ? ADMIN_LINKS : CLIENT_LINKS;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={hasNews ? "Mi cuenta, tienes novedades" : "Mi cuenta"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`${compact ? iconClass : `${pillClass} pl-1.5`} ${isOpen ? "bg-accent/[0.06]" : ""}`}
      >
        <Initial name={displayName} />
        {!compact && "Mi cuenta"}
        {hasNews && <NewsDot />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+10px)] w-60 origin-top-right rounded-[22px] bg-white p-1.5 shadow-card ring-1 ring-black/5"
          >
            <p className="truncate px-3.5 pb-1.5 pt-2 text-sm font-semibold">Hola, {displayName}</p>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-black/75 transition-colors hover:bg-canvas hover:text-black aria-[current=page]:text-accent"
              >
                <Icon size={17} className="shrink-0" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                void signOut();
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl border-t border-black/5 px-3.5 py-2.5 text-left text-sm font-semibold text-muted transition-colors hover:bg-canvas hover:text-black"
            >
              <LogOut size={17} className="shrink-0" />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
