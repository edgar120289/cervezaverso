import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mpPreference } from "@/lib/mercadopago";
import { folio } from "@/lib/pedidos";
import { SITE } from "@/lib/site";

/** Vigencia de cada preferencia (y de las fichas de OXXO y SPEI que se generen con ella). */
export const PAGO_VIGENCIA_HORAS = 72;

export type PedidoParaPago = {
  pedidoId: string;
  nombre: string;
  email: string;
  telefono: string;
  lineas: { sku: string; nombre: string; precio_unitario: number; cantidad: number }[];
  descuento: number;
  descuentoVolumen: number;
  costoEnvio: number;
  total: number;
};

/**
 * Crea la preferencia de Checkout Pro a partir de un pedido ya calculado en el servidor
 * (nunca de datos del navegador). Vence a las `PAGO_VIGENCIA_HORAS`. Lanza si Mercado Pago no devuelve `init_point`.
 */
export async function crearPreferenciaPedido(pedido: PedidoParaPago, idempotencyKey: string) {
  const esHttps = SITE.url.startsWith("https://");
  const back = (pago: string) => `${SITE.url}/pedido/${pedido.pedidoId}?pago=${pago}`;

  // Mercado Pago no admite montos negativos: con descuento, el pedido va en un solo renglón por el total.
  const items =
    pedido.descuento + pedido.descuentoVolumen > 0
      ? [
          {
            id: pedido.pedidoId,
            title: `Pedido #${folio(pedido.pedidoId)} en Cervezaverso (con descuento)`,
            quantity: 1,
            unit_price: pedido.total,
            currency_id: "MXN",
          },
        ]
      : [
          ...pedido.lineas.map((linea) => ({
            id: linea.sku,
            title: linea.nombre,
            quantity: linea.cantidad,
            unit_price: linea.precio_unitario,
            currency_id: "MXN",
          })),
          ...(pedido.costoEnvio > 0
            ? [{ id: "envio", title: "Envío", quantity: 1, unit_price: pedido.costoEnvio, currency_id: "MXN" }]
            : []),
        ];

  // Sin vencimiento, un enlace o ficha de OXXO viejo podía pagarse semanas después con precios ya cambiados.
  const desde = new Date();
  const expiraAt = new Date(desde.getTime() + PAGO_VIGENCIA_HORAS * 60 * 60 * 1000).toISOString();

  const preference = await mpPreference().create({
    body: {
      expires: true,
      expiration_date_from: desde.toISOString(),
      expiration_date_to: expiraAt,
      date_of_expiration: expiraAt,
      items,
      payer: { name: pedido.nombre, email: pedido.email, phone: { number: pedido.telefono } },
      external_reference: pedido.pedidoId,
      back_urls: { success: back("exitoso"), pending: back("pendiente"), failure: back("fallido") },
      // Mercado Pago rechaza auto_return y notification_url con direcciones locales.
      ...(esHttps ? { auto_return: "approved", notification_url: `${SITE.url}/api/webhooks/mercadopago` } : {}),
      statement_descriptor: "CERVEZAVERSO",
    },
    requestOptions: { idempotencyKey },
  });
  if (!preference.id || !preference.init_point) throw new Error("La preferencia no devolvió init_point.");
  return { id: preference.id, initPoint: preference.init_point, expiraAt };
}

/**
 * Guarda la preferencia vigente del pedido. El vencimiento va en una escritura aparte para que, si
 * la migración 025 aún no se aplicó, el `mp_preference_id` se guarde de todos modos.
 */
export async function guardarPreferencia(
  admin: SupabaseClient,
  pedidoId: string,
  preference: { id: string; expiraAt: string },
) {
  await admin.from("pedidos").update({ mp_preference_id: preference.id }).eq("id", pedidoId).eq("estado", "Pendiente");
  const { error } = await admin.from("pedidos").update({ pago_expira_at: preference.expiraAt }).eq("id", pedidoId);
  if (error) console.error("[pago] No se guardó el vencimiento del pago:", error.message);
}
