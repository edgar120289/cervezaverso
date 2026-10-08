import { NextResponse } from "next/server";
import { registrarPedido, liberarPromo } from "@/lib/checkout-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPreferenciaPedido } from "@/lib/mercadopago-checkout";

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
  try {
    const preference = await crearPreferenciaPedido(pedido, pedido.pedidoId);
    await admin.from("pedidos").update({ mp_preference_id: preference.id }).eq("id", pedido.pedidoId);
    return NextResponse.json({ pedidoId: pedido.pedidoId, initPoint: preference.initPoint });
  } catch (err) {
    console.error("[checkout] Error al crear la preferencia de Mercado Pago:", err);
    // Sin pasarela no hay pedido que cobrar: se cancela y se devuelve el cupón.
    await admin.from("pedidos").update({ estado: "Cancelado" }).eq("id", pedido.pedidoId);
    await liberarPromo(pedido.promoId);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }
}
