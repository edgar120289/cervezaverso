import { NextResponse } from "next/server";
import { registrarPedido, liberarPromo } from "@/lib/checkout-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPreference } from "@/lib/mercadopago";
import { folio } from "@/lib/pedidos";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "No pudimos iniciar el pago. Intenta de nuevo en unos minutos.";

/**
 * Crea el pedido (Pendiente) y la preferencia de Checkout Pro. El cuerpo del navegador solo aporta
 * producto + cantidad: precios, descuento, envío y total se calculan en `registrarPedido` con datos
 * de Supabase, y la preferencia se arma únicamente con ese resultado.
 */
export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const pedido = await registrarPedido(input);
  if (!pedido.ok) {
    return NextResponse.json({ error: pedido.error, promoInvalid: pedido.promoInvalid ?? false }, { status: 422 });
  }

  const admin = createAdminClient();
  const numero = folio(pedido.pedidoId);
  const esHttps = SITE.url.startsWith("https://");
  const back = (pago: string) => `${SITE.url}/pedido/${pedido.pedidoId}?pago=${pago}`;

  // Mercado Pago no admite montos negativos: con descuento, el pedido va en un solo renglón por el total.
  const items =
    pedido.descuento > 0
      ? [
          {
            id: pedido.pedidoId,
            title: `Pedido #${numero} en Cervezaverso (con descuento)`,
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

  try {
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
      requestOptions: { idempotencyKey: pedido.pedidoId },
    });
    if (!preference.id || !preference.init_point) throw new Error("La preferencia no devolvió init_point.");

    await admin.from("pedidos").update({ mp_preference_id: preference.id }).eq("id", pedido.pedidoId);
    return NextResponse.json({ pedidoId: pedido.pedidoId, initPoint: preference.init_point });
  } catch (err) {
    console.error("[checkout] Error al crear la preferencia de Mercado Pago:", err);
    // Sin pasarela no hay pedido que cobrar: se cancela y se devuelve el cupón.
    await admin.from("pedidos").update({ estado: "Cancelado" }).eq("id", pedido.pedidoId);
    await liberarPromo(pedido.promoId);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }
}
