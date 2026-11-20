import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PEDIDO_DETALLE_COLUMNS } from "@/lib/pedidos";
import type { PedidoPago } from "@/lib/pedido-pagos";
import type { PedidoDetalle } from "@/lib/types";

export type NotaInterna = { id: string; texto: string; autor: string | null; created_at: string };
export type EntradaBitacora = { id: string; accion: string; detalle: string | null; autor: string | null; created_at: string };

const ESTADOS_COBRADOS = ["Pagado", "Enviado", "Entregado"];

/** Registra un cambio en la bitácora del pedido. Nunca lanza: la bitácora no debe tumbar la acción. */
export async function registrarBitacora(pedidoId: string, accion: string, detalle: string | null, autor: string) {
  const { error } = await createAdminClient().from("pedido_bitacora").insert({ pedido_id: pedidoId, accion, detalle, autor });
  if (error) console.error("[pedidos] No se pudo escribir la bitácora:", error.message);
}

/**
 * Un pedido cobrado sin pagos registrados (p. ej. Mercado Pago confirmó después de la 036) recibe su pago
 * original: monto = total, método del pedido, recibido. Idempotente por el índice único de «es_original».
 */
export async function asegurarPagoOriginal(pedido: Pick<PedidoDetalle, "id" | "estado" | "total" | "fecha" | "metodo_pago"> & { mp_payment_id?: string | null }) {
  if (!ESTADOS_COBRADOS.includes(pedido.estado) || Number(pedido.total) <= 0) return;
  const admin = createAdminClient();
  const { count } = await admin.from("pedido_pagos").select("id", { count: "exact", head: true }).eq("pedido_id", pedido.id);
  if ((count ?? 0) > 0) return;
  const { error } = await admin.from("pedido_pagos").insert({
    pedido_id: pedido.id,
    metodo: pedido.metodo_pago ?? "mercadopago",
    monto: Number(pedido.total),
    estado: "recibido",
    es_original: true,
    referencia: pedido.mp_payment_id ?? null,
    fecha: pedido.fecha,
    recibido_at: new Date().toISOString(),
    creado_por: "sistema",
  });
  // 23505: otro proceso ya lo registró.
  if (error && error.code !== "23505") console.error("[pedidos] No se pudo registrar el pago original:", error.message);
}

export type PedidoCompleto = {
  pedido: PedidoDetalle & { mp_payment_id?: string | null };
  pagos: PedidoPago[];
};

/** Pedido con renglones y pagos (service role). Para el panel, el PDF y los correos; nunca incluye notas internas. */
export async function getPedidoCompleto(id: string): Promise<PedidoCompleto | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("pedidos").select(PEDIDO_DETALLE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const pedido = data as unknown as PedidoCompleto["pedido"];
  pedido.pedido_items.sort((a, b) => Number(a.agregado ?? false) - Number(b.agregado ?? false));
  await asegurarPagoOriginal(pedido);
  const { data: pagos } = await admin
    .from("pedido_pagos")
    .select("id, metodo, monto, estado, es_original, referencia, fecha, recibido_at")
    .eq("pedido_id", id)
    .order("es_original", { ascending: false })
    .order("fecha", { ascending: true });
  return { pedido, pagos: (pagos ?? []).map((p) => ({ ...p, monto: Number(p.monto) })) as PedidoPago[] };
}

/** Solo panel: notas internas y bitácora. */
export async function getPedidoInterno(id: string): Promise<{ notas: NotaInterna[]; bitacora: EntradaBitacora[] }> {
  const admin = createAdminClient();
  const [notas, bitacora] = await Promise.all([
    admin.from("pedido_notas_internas").select("id, texto, autor, created_at").eq("pedido_id", id).order("created_at", { ascending: false }),
    admin.from("pedido_bitacora").select("id, accion, detalle, autor, created_at").eq("pedido_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return { notas: (notas.data ?? []) as NotaInterna[], bitacora: (bitacora.data ?? []) as EntradaBitacora[] };
}

/** Ids de pedidos con algún pago pendiente (etiqueta «Pago adicional pendiente» en la lista). */
export async function pedidosConPagoPendiente(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data } = await createAdminClient().from("pedido_pagos").select("pedido_id").eq("estado", "pendiente").in("pedido_id", ids);
  return new Set((data ?? []).map((row) => row.pedido_id as string));
}
