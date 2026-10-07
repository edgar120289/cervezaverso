"use client";

import { useTransition } from "react";
import { cambiarEstadoPedido } from "@/app/actions/admin-pedidos";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/types";

export default function PedidoEstadoSelect({ id, estado }: { id: string; estado: EstadoPedido }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label="Cambiar estado del pedido"
      value={estado}
      disabled={isPending}
      onChange={(event) => {
        const nuevo = event.target.value;
        startTransition(async () => {
          const result = await cambiarEstadoPedido(id, nuevo);
          if (!result.ok) window.alert(result.error);
        });
      }}
      className="h-11 w-fit rounded-full bg-canvas px-4 text-xs font-semibold disabled:opacity-50"
    >
      {ESTADOS_PEDIDO.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </select>
  );
}
