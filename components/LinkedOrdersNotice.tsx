"use client";

import { useEffect, useState } from "react";
import { PartyPopper, X } from "lucide-react";
import { LINKED_ORDERS_COOKIE, linkedOrdersMessage, parseLinkedOrders, type LinkedOrders } from "@/lib/linked-orders";

/**
 * Aviso discreto, dentro de la página (no flota ni tapa nada), cuando al entrar se ligaron
 * pedidos hechos como invitado. Se lee una vez y la cookie se borra.
 */
export default function LinkedOrdersNotice({ className = "" }: { className?: string }) {
  const [linked, setLinked] = useState<LinkedOrders | null>(null);

  useEffect(() => {
    const raw = document.cookie.split("; ").find((part) => part.startsWith(`${LINKED_ORDERS_COOKIE}=`));
    if (!raw) return;
    document.cookie = `${LINKED_ORDERS_COOKIE}=; path=/; max-age=0; samesite=lax`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la cookie solo existe en el navegador
    setLinked(parseLinkedOrders(decodeURIComponent(raw.slice(LINKED_ORDERS_COOKIE.length + 1))));
  }, []);

  if (!linked) return null;

  return (
    <div role="status" className={`flex items-center gap-3 rounded-[20px] bg-accent/[0.06] px-4 py-2 text-sm ${className}`}>
      <PartyPopper size={18} className="shrink-0 text-accent" aria-hidden />
      <p className="flex-1 font-semibold text-black/80">{linkedOrdersMessage(linked)}</p>
      <button
        type="button"
        onClick={() => setLinked(null)}
        aria-label="Cerrar aviso"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-black/5"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
