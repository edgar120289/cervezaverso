"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import SommelierModal from "./SommelierModal";

type SommelierContextValue = { openQuiz: () => void };

const SommelierContext = createContext<SommelierContextValue | null>(null);

/** Un solo quiz para todo el sitio. Vive en el layout: ir de /tienda a Inicio y volver no reinicia la conversación. */
export function SommelierProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(() => ({ openQuiz: () => setIsOpen(true) }), []);

  return (
    <SommelierContext.Provider value={value}>
      {children}
      <SommelierModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </SommelierContext.Provider>
  );
}

export function useSommelier() {
  const ctx = useContext(SommelierContext);
  if (!ctx) throw new Error("useSommelier debe usarse dentro de <SommelierProvider>");
  return ctx;
}
