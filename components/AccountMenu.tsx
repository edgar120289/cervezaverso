"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, User, UserRound } from "lucide-react";
import { useAccount } from "@/lib/account-context";

const iconButtonClass =
  "relative flex h-11 w-11 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5";

function SessionDot() {
  return <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-pill border-2 border-white bg-accent" />;
}

const ADMIN_LINKS = [
  { href: "/admin", label: "Panel de Administración", icon: LayoutDashboard },
  { href: "/cuenta", label: "Mi Cuenta Cliente", icon: UserRound },
];

/** Ícono de perfil del header: enlace directo para clientes, menú desplegable para admins. */
export default function AccountMenu() {
  const { user, role } = useAccount();
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

  if (role !== "admin") {
    return (
      <Link
        href={user ? "/cuenta" : "/login"}
        aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
        className={iconButtonClass}
      >
        <User size={20} />
        {user && <SessionDot />}
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Menú de cuenta"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`${iconButtonClass} ${isOpen ? "bg-black/5" : ""}`}
      >
        <User size={20} />
        <SessionDot />
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
            <p className="truncate px-3.5 pb-1.5 pt-2 text-xs text-black/40">{user?.email}</p>
            {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-black/75 transition-colors hover:bg-[#f2f4f5] hover:text-black aria-[current=page]:text-accent"
              >
                <Icon size={17} className="shrink-0" />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
