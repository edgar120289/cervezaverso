import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import {
  avisoPedidoAdminEmail,
  esEstadoConCorreo,
  estadoPedidoEmail,
  premioDesbloqueadoEmail,
  type MotivoAvisoAdmin,
} from "@/lib/email/templates";
import { formatMXN, PAYMENT_METHODS, type PaymentMethod } from "@/lib/pricing";
import { folio, PEDIDO_DETALLE_COLUMNS } from "@/lib/pedidos";
import { getShippingZone } from "@/lib/shipping-zones";
import { CONTACT, SITE } from "@/lib/site";
import type { PedidoDetalle } from "@/lib/types";

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
export async function notificarEstadoPedido(pedidoId: string, estado: string): Promise<boolean> {
  if (!esEstadoConCorreo(estado)) return false;
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .maybeSingle();
  if (error || !data) {
    console.error("[lealtad] No se pudo leer el pedido para el correo:", error?.message ?? "sin datos");
    return false;
  }
  const mensaje = estadoPedidoEmail(estado, {
    nombre: data.cliente_nombre,
    folio: folio(data.id),
    total: formatMXN(Number(data.total)),
    descuentoVolumen: Number(data.descuento_volumen ?? 0) > 0 ? formatMXN(Number(data.descuento_volumen)) : undefined,
    pedidoUrl: `${SITE.url}/pedido/${data.id}`,
  });
  return sendEmail({ to: data.cliente_email, ...mensaje });
}

/**
 * Avisa al dueño (CONTACT.email) de un pedido que necesita su atención: pagado, por transferencia,
 * o una anomalía de cobro. Nunca lanza: un aviso caído no debe romper el webhook ni el checkout.
 */
export async function notificarAdminPedido(pedidoId: string, motivo: MotivoAvisoAdmin, pagoId?: string): Promise<void> {
  try {
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .select(PEDIDO_DETALLE_COLUMNS)
      .eq("id", pedidoId)
      .maybeSingle();
    if (error || !data) {
      console.error("[aviso-admin] No se pudo leer el pedido:", error?.message ?? "sin datos");
      return;
    }
    const pedido = data as unknown as PedidoDetalle & { metodo_pago?: PaymentMethod | null };
    const d = pedido.direccion;
    const zona = getShippingZone(d) === "metro" ? "CDMX y zona metropolitana (24 a 48 h)" : "Resto del país (3 a 6 días hábiles)";
    const costoEnvio = Number(pedido.costo_envio ?? 0);
    const mensaje = avisoPedidoAdminEmail(motivo, {
      folio: folio(pedido.id),
      cliente: pedido.cliente_nombre,
      email: pedido.cliente_email,
      telefono: pedido.cliente_telefono ?? "",
      total: formatMXN(Number(pedido.total)),
      metodoPago: PAYMENT_METHODS[pedido.metodo_pago ?? "mercadopago"]?.label ?? String(pedido.metodo_pago),
      envio: `${zona} · ${costoEnvio > 0 ? formatMXN(costoEnvio) : "gratis"}`,
      direccion: d
        ? [d.calle, d.colonia, `${d.ciudad}, ${d.estado}`, `CP ${d.codigo_postal}`, d.referencias].filter(Boolean).join(" · ")
        : "Sin dirección",
      lineas: (pedido.pedido_items ?? []).map((i) => `${i.cantidad} × ${i.nombre} (${formatMXN(Number(i.importe))})`),
      adminUrl: `${SITE.url}/admin/pedidos/${pedido.id}`,
      pagoId,
    });
    // Directo al buzón del dueño (ADMIN_NOTIFY_EMAIL): los reenvíos de ImprovMX llegan peor a Outlook.
    await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL?.trim() || CONTACT.email, ...mensaje, replyTo: pedido.cliente_email });
  } catch (err) {
    console.error("[aviso-admin] Error al avisar del pedido:", err instanceof Error ? err.message : err);
  }
}
