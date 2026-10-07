"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarEstadoPedido, procesarPedidoPagado, revertirPedidoCancelado } from "@/lib/lealtad-server";
import { ESTADOS_PEDIDO } from "@/lib/types";

export type PedidoEstadoResult = { ok: true } | { ok: false; error: string };

const schema = z.object({ id: z.uuid(), estado: z.enum(ESTADOS_PEDIDO) });

const ESTADOS_PAGADOS: readonly string[] = ["Pagado", "Enviado", "Entregado"];

/** Cambia el estado de un pedido; al pagarse acredita botellas, al cancelarse las revierte, y avisa al cliente por correo. */
export async function cambiarEstadoPedido(id: string, estado: string): Promise<PedidoEstadoResult> {
  const parsed = schema.safeParse({ id, estado });
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  await requireAdmin("/admin/pedidos");
  const admin = createAdminClient();
  const { data: previo } = await admin.from("pedidos").select("estado").eq("id", parsed.data.id).maybeSingle();
  const { data, error } = await admin
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
  if (parsed.data.estado === "Cancelado") await revertirPedidoCancelado(parsed.data.id);
  // Correo solo si el estado realmente cambió (evita duplicados al reseleccionar el mismo).
  if (previo?.estado !== parsed.data.estado) await notificarEstadoPedido(parsed.data.id, parsed.data.estado);

  refresh();
  return { ok: true };
}
