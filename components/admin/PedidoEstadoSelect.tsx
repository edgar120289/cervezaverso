"use client";

import { useTransition } from "react";
import { cambiarEstadoPedido } from "@/app/actions/admin-pedidos";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/types";

export default function PedidoEstadoSelect({
  id,
  estado,
  prominent = false,
}: {
  id: string;
  estado: EstadoPedido;
  /** Versión grande para el detalle del pedido. */
  prominent?: boolean;
}) {
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
      className={`w-fit rounded-full font-semibold disabled:opacity-50 ${
        prominent ? "h-14 bg-accent px-8 text-base text-white shadow-accent" : "relative z-10 h-11 bg-canvas px-4 text-xs"
      }`}
    >
      {ESTADOS_PEDIDO.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </select>
  );
}
