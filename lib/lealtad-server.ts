import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { esEstadoConCorreo, estadoPedidoEmail, premioDesbloqueadoEmail } from "@/lib/email/templates";
import { formatMXN } from "@/lib/pricing";
import { folio } from "@/lib/pedidos";
import { SITE } from "@/lib/site";

const resultadoSchema = z.object({
  status: z.enum(["acreditado", "ya_acreditado", "no_pagado", "no_encontrado", "sin_cuenta"]),
  email: z.string().optional(),
  nombre: z.string().optional(),
  total: z.number().optional(),
  premios: z.array(z.object({ nivel: z.number(), code: z.string(), label: z.string() })).default([]),
});

/**
 * Suma las botellas de un pedido pagado al contador del cliente y entrega los premios
 * que cruce. Es idempotente (`acreditar_botellas` marca el pedido), así que puede
 * llamarse desde el cambio de estado del admin y, después, desde el webhook de Mercado Pago.
 */
export async function procesarPedidoPagado(pedidoId: string): Promise<void> {
  const { data, error } = await createAdminClient().rpc("acreditar_botellas", { p_pedido_id: pedidoId });
  if (error) {
    console.error("[lealtad] Error al acreditar botellas:", error.message);
    return;
  }
  const parsed = resultadoSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[lealtad] Respuesta inesperada de acreditar_botellas.");
    return;
  }

  const { email, nombre, premios } = parsed.data;
  if (parsed.data.status !== "acreditado" || !email) return;

  for (const premio of premios) {
    const mensaje = premioDesbloqueadoEmail({
      nombre: nombre ?? "cervecero",
      nivel: premio.nivel,
      premio: premio.label,
      code: premio.code,
    });
    await sendEmail({ to: email, ...mensaje });
  }
}

/** Resta las botellas que sumó un pedido ahora cancelado (idempotente en SQL). */
export async function revertirPedidoCancelado(pedidoId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("revertir_botellas", { p_pedido_id: pedidoId });
  if (error) console.error("[lealtad] Error al revertir botellas:", error.message);
}

/** Avisa al cliente del cambio de estado de su pedido (solo Pagado, Enviado y Cancelado). */
export async function notificarEstadoPedido(pedidoId: string, estado: string): Promise<void> {
  if (!esEstadoConCorreo(estado)) return;
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("id, cliente_nombre, cliente_email, total")
    .eq("id", pedidoId)
    .maybeSingle();
  if (error || !data) {
    console.error("[lealtad] No se pudo leer el pedido para el correo:", error?.message ?? "sin datos");
    return;
  }
  const mensaje = estadoPedidoEmail(estado, {
    nombre: data.cliente_nombre,
    folio: folio(data.id),
    total: formatMXN(Number(data.total)),
    pedidoUrl: `${SITE.url}/pedido/${data.id}`,
  });
  await sendEmail({ to: data.cliente_email, ...mensaje });
}
