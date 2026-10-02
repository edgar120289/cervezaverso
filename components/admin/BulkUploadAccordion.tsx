"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const ANCHOR = "#ingesta";

/** Acordeón cerrado por defecto; también se abre con el enlace `#ingesta` del menú del admin. */
export default function BulkUploadAccordion({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === ANCHOR) setIsOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <section id="ingesta" className="scroll-mt-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="ingesta-panel"
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-white px-6 text-left text-sm font-semibold shadow-card transition-colors hover:bg-black/5"
      >
        <span>{isOpen ? "⬆️ Ocultar herramienta de carga masiva" : "⬇️ Desplegar herramienta de carga masiva"}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div id="ingesta-panel" hidden={!isOpen} className="mt-4">
        {children}
      </div>
    </section>
  );
}
