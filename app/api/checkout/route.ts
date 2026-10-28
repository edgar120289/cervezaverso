import { NextResponse } from "next/server";
import { registrarPedido, liberarPromo } from "@/lib/checkout-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPreferenciaPedido, guardarPreferencia } from "@/lib/mercadopago-checkout";
import { notificarAdminPedido } from "@/lib/lealtad-server";

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

  // Transferencia: no hay pasarela; el pedido queda Pendiente hasta que el administrador confirme el depósito.
  if (pedido.metodoPago === "transferencia") {
    await notificarAdminPedido(pedido.pedidoId, "transferencia");
    return NextResponse.json({ pedidoId: pedido.pedidoId, redirectUrl: `/pedido/${pedido.pedidoId}?pago=transferencia` });
  }

  const admin = createAdminClient();
  try {
    const preference = await crearPreferenciaPedido(pedido, pedido.pedidoId);
    await guardarPreferencia(admin, pedido.pedidoId, preference);
    return NextResponse.json({ pedidoId: pedido.pedidoId, initPoint: preference.initPoint });
  } catch (err) {
    console.error("[checkout] Error al crear la preferencia de Mercado Pago:", err);
    // Sin pasarela no hay pedido que cobrar: se cancela y se devuelve el cupón.
    await admin.from("pedidos").update({ estado: "Cancelado" }).eq("id", pedido.pedidoId);
    await liberarPromo(pedido.promoId);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }
}
