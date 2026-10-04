"use client";

import { createContext, Suspense, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SommelierModal from "./SommelierModal";

type SommelierContextValue = { openQuiz: () => void };

const SommelierContext = createContext<SommelierContextValue | null>(null);

/** `?chat=open` abre el chat al llegar (y `&mode=text` enfoca la escritura); después limpia la URL para que recargar no lo reabra. */
function ChatUrlTrigger({ onOpen }: { onOpen: (focusInput: boolean) => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("chat") !== "open") return;
    onOpen(searchParams.get("mode") === "text");
    const next = new URLSearchParams(searchParams);
    next.delete("chat");
    next.delete("mode");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, onOpen]);

  return null;
}

/** Un solo Sommelier para todo el sitio. Vive en el layout: ir de /tienda a Inicio y volver no reinicia la conversación. */
export function SommelierProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusInput, setFocusInput] = useState(false);
  const value = useMemo(
    () => ({
      openQuiz: () => {
        setFocusInput(false);
        setIsOpen(true);
      },
    }),
    []
  );
  const openFromUrl = useMemo(
    () => (focus: boolean) => {
      setFocusInput(focus);
      setIsOpen(true);
    },
    []
  );

  return (
    <SommelierContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <ChatUrlTrigger onOpen={openFromUrl} />
      </Suspense>
      <SommelierModal isOpen={isOpen} focusInput={focusInput} onClose={() => setIsOpen(false)} />
    </SommelierContext.Provider>
  );
}

export function useSommelier() {
  const ctx = useContext(SommelierContext);
  if (!ctx) throw new Error("useSommelier debe usarse dentro de <SommelierProvider>");
  return ctx;
}
