import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPayment } from "@/lib/mercadopago";
import { isValidMercadoPagoSignature } from "@/lib/mercadopago-signature";
import { notificarEstadoPedido, procesarPedidoPagado } from "@/lib/lealtad-server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  type: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).transform(String) }).optional(),
});

const ESTADOS_COBRADOS = ["Pagado", "Enviado", "Entregado"];

/**
 * Webhook de Mercado Pago. Es la única vía que da un pedido por pagado: la firma se verifica,
 * el pago se vuelve a consultar a la API de Mercado Pago (el cuerpo recibido no se cree) y su
 * monto debe coincidir con el total guardado en el pedido.
 * 200 = notificación atendida o descartada; 500 = error transitorio, Mercado Pago reintenta.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  const dataId = url.searchParams.get("data.id") ?? (body.success ? (body.data.data?.id ?? null) : null);

  if (!isValidMercadoPagoSignature(request, url.searchParams.get("data.id"))) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const type = url.searchParams.get("type") ?? (body.success ? body.data.type : undefined);
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignorado: true });

  try {
    const pago = await mpPayment().get({ id: dataId });
    if (pago.status !== "approved") return NextResponse.json({ ok: true, estado: pago.status ?? null });

    const pedidoId = z.uuid().safeParse(pago.external_reference);
    if (!pedidoId.success) {
      console.error("[mp-webhook] Pago aprobado sin referencia de pedido válida:", dataId);
      return NextResponse.json({ ok: true, ignorado: true });
    }

    const admin = createAdminClient();
    const { data: pedido, error } = await admin
      .from("pedidos")
      .select("id, estado, total, mp_payment_id")
      .eq("id", pedidoId.data)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pedido) {
      console.error("[mp-webhook] Pago aprobado de un pedido inexistente:", dataId);
      return NextResponse.json({ ok: true, ignorado: true });
    }

    // El monto y la moneda deben coincidir con lo calculado en el servidor al crear el pedido.
    if (pago.currency_id !== "MXN" || Math.abs(Number(pago.transaction_amount) - Number(pedido.total)) > 0.009) {
      console.error("[mp-webhook] El monto del pago no coincide con el pedido:", pedido.id, dataId);
      return NextResponse.json({ ok: true, ignorado: true });
    }

    if (pedido.estado === "Pendiente") {
      // Condicionado al estado: dos notificaciones simultáneas solo marcan (y avisan) una vez.
      const { data: actualizado, error: updateError } = await admin
        .from("pedidos")
        .update({ estado: "Pagado", mp_payment_id: dataId })
        .eq("id", pedido.id)
        .eq("estado", "Pendiente")
        .select("id");
      if (updateError) throw new Error(updateError.message);
      if (actualizado?.length) {
        await procesarPedidoPagado(pedido.id);
        await notificarEstadoPedido(pedido.id, "Pagado");
      }
    } else if (ESTADOS_COBRADOS.includes(pedido.estado)) {
      if (pedido.mp_payment_id && pedido.mp_payment_id !== dataId) {
        console.error("[mp-webhook] Segundo pago aprobado para un pedido ya cobrado:", pedido.id, dataId);
      } else {
        // Reintento tras un fallo a medias: la acreditación de botellas es idempotente.
        await procesarPedidoPagado(pedido.id);
      }
    } else {
      console.error("[mp-webhook] Pago aprobado de un pedido cancelado; requiere reembolso manual:", pedido.id, dataId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp-webhook] Error al procesar la notificación:", err);
    return NextResponse.json({ error: "Error temporal." }, { status: 500 });
  }
}
