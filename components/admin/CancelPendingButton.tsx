"use client";

import { useTransition } from "react";
import { cancelarPedidoPendiente } from "@/app/actions/admin-pedidos";

export default function CancelPendingButton({ id, promoCode }: { id: string; promoCode: string | null }) {
  const [isPending, startTransition] = useTransition();

  function cancel() {
    const aviso = promoCode
      ? `Se cancelará el pedido y el cupón ${promoCode} quedará disponible de nuevo. ¿Continuar?`
      : "Se cancelará el pedido. ¿Continuar?";
    if (!window.confirm(aviso)) return;
    startTransition(async () => {
      const result = await cancelarPedidoPendiente(id);
      if (!result.ok) window.alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={isPending}
      className="min-h-11 rounded-full border border-black/15 bg-white px-5 text-sm font-semibold transition-colors hover:bg-canvas disabled:opacity-50"
    >
      {isPending ? "Cancelando…" : "Cancelar pedido abandonado"}
    </button>
  );
}
