"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { procesarPedidoPagado } from "@/lib/lealtad-server";
import { ESTADOS_PEDIDO } from "@/lib/types";

export type PedidoEstadoResult = { ok: true } | { ok: false; error: string };

const schema = z.object({ id: z.uuid(), estado: z.enum(ESTADOS_PEDIDO) });

const ESTADOS_PAGADOS: readonly string[] = ["Pagado", "Enviado", "Entregado"];

/** Cambia el estado de un pedido; al quedar pagado, acredita botellas y premios. */
export async function cambiarEstadoPedido(id: string, estado: string): Promise<PedidoEstadoResult> {
  const parsed = schema.safeParse({ id, estado });
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  await requireAdmin("/admin/pedidos");
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .update({ estado: parsed.data.estado })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) {
    console.error("[admin-pedidos] Error al cambiar estado:", error.message);
    return { ok: false, error: "No se pudo actualizar el pedido." };
  }
  if (!data?.length) return { ok: false, error: "No se encontró el pedido." };

  if (ESTADOS_PAGADOS.includes(parsed.data.estado)) await procesarPedidoPagado(parsed.data.id);

  refresh();
  return { ok: true };
}
