import "server-only";
import { mpPreference } from "@/lib/mercadopago";
import { folio } from "@/lib/pedidos";
import { SITE } from "@/lib/site";

export type PedidoParaPago = {
  pedidoId: string;
  nombre: string;
  email: string;
  telefono: string;
  lineas: { sku: string; nombre: string; precio_unitario: number; cantidad: number }[];
  descuento: number;
  costoEnvio: number;
  total: number;
};

/**
 * Crea la preferencia de Checkout Pro a partir de un pedido ya calculado en el servidor
 * (nunca de datos del navegador). Lanza si Mercado Pago no devuelve `init_point`.
 */
export async function crearPreferenciaPedido(pedido: PedidoParaPago, idempotencyKey: string) {
  const esHttps = SITE.url.startsWith("https://");
  const back = (pago: string) => `${SITE.url}/pedido/${pedido.pedidoId}?pago=${pago}`;

  // Mercado Pago no admite montos negativos: con descuento, el pedido va en un solo renglón por el total.
  const items =
    pedido.descuento > 0
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

  const preference = await mpPreference().create({
    body: {
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
  return { id: preference.id, initPoint: preference.init_point };
}
