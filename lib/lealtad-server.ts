import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { premioDesbloqueadoEmail } from "@/lib/email/templates";

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
