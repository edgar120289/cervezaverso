"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { SEARCH_PARAM } from "@/lib/catalog-filters";
import { useAccount } from "@/lib/account-context";
import { useIsClient } from "@/lib/use-is-client";

const itemClass =
  "flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-base font-semibold text-black/75 transition-colors hover:bg-canvas hover:text-black";

/** Menú hamburguesa del móvil (hasta md): panel lateral con búsqueda, navegación y cuenta. */
export default function MobileMenu() {
  const { user, role, signOut } = useAccount();
  const pathname = usePathname();
  const isClient = useIsClient();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) =>
      e.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        className="flex h-11 w-11 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5"
      >
        <Menu size={22} />
      </button>

      {isClient &&
        createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[60]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
                aria-hidden
                className="absolute inset-0 bg-black/40"
              />
              <motion.nav
                id="mobile-menu"
                aria-label="Menú principal"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-1 overflow-y-auto rounded-r-[28px] bg-white p-4 shadow-card"
              >
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="mb-2 flex h-11 w-11 items-center justify-center self-end rounded-full text-black/70 hover:bg-black/5"
                >
                  <X size={22} />
                </button>

                <Form
                  action="/"
                  role="search"
                  onSubmit={close}
                  className="relative mb-2"
                >
                  <Search
                    size={17}
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <label htmlFor="mobile-menu-search" className="sr-only">
                    Buscar cervezas
                  </label>
                  <input
                    id="mobile-menu-search"
                    type="search"
                    name={SEARCH_PARAM}
                    placeholder="Busca una cerveza"
                    enterKeyHint="search"
                    className="w-full rounded-full bg-canvas py-2.5 pl-10 pr-4 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </Form>

                <Link href="/tienda" className={itemClass}>
                  <Store size={18} className="shrink-0" />
                  Tienda
                </Link>
                <Link href="/contacto" className={itemClass}>
                  <Mail size={18} className="shrink-0" />
                  Contacto
                </Link>

                <div className="my-2 border-t border-black/5" />

                {user ? (
                  <>
                    <p className="truncate px-3.5 py-1 text-sm text-muted">
                      Hola, {user.email?.split("@")[0]}
                    </p>
                    {role === "admin" ? (
                      <Link href="/admin" className={itemClass}>
                        <LayoutDashboard size={18} className="shrink-0" />
                        Panel de Administración
                      </Link>
                    ) : (
                      <Link href="/cuenta" className={itemClass}>
                        <UserRound size={18} className="shrink-0" />
                        Mi cuenta
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        void signOut();
                      }}
                      className={`${itemClass} text-left text-muted`}
                    >
                      <LogOut size={18} className="shrink-0" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link href="/login" className={itemClass}>
                    <LogIn size={18} className="shrink-0" />
                    Iniciar sesión
                  </Link>
                )}
              </motion.nav>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
