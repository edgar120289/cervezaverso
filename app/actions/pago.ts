"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/security/form-guard";
import { isWithinRateLimit } from "@/lib/security/rate-limit";
import { crearPreferenciaPedido, guardarPreferencia } from "@/lib/mercadopago-checkout";

export type ReintentoResult = { ok: true; initPoint: string } | { ok: false; error: string };

type ItemPedido = { product_id: string | null; sku: string; nombre: string; precio_unitario: number | string; cantidad: number };

const GENERIC_ERROR = "No pudimos iniciar el pago. Intenta de nuevo en unos minutos.";

/**
 * Genera una preferencia nueva para un pedido que sigue Pendiente. Cobra exactamente lo guardado en el
 * pedido (renglones, envío y descuento ya congelados), nunca datos del navegador. Un pedido con dueño
 * solo lo reintenta su dueño; el de un invitado se identifica por su UUID, igual que la página del pedido.
 * Esta acción no cancela nada: cancelar un pedido es exclusivo del administrador.
 */
export async function reintentarPago(pedidoId: string): Promise<ReintentoResult> {
  const id = z.uuid().safeParse(pedidoId);
  if (!id.success) return { ok: false, error: "Pedido no encontrado." };

  if (!(await isWithinRateLimit("checkout", await getClientIp()))) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." };
  }

  const admin = createAdminClient();
  const { data: pedido } = await admin
    .from("pedidos")
    // `*`: incluye descuento_volumen (migración 021) cuando existe, sin romper el reintento si aún no se aplica.
    .select("*, pedido_items (product_id, sku, nombre, precio_unitario, cantidad)")
    .eq("id", id.data)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "Pedido no encontrado." };

  if (pedido.user_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== pedido.user_id) return { ok: false, error: "Pedido no encontrado." };
  }
  if (pedido.metodo_pago === "transferencia") return { ok: false, error: "Este pedido se paga por transferencia." };
  if (pedido.estado !== "Pendiente") return { ok: false, error: "Este pedido ya no está pendiente de pago." };

  // Los productos pudieron agotarse o desactivarse desde la compra original.
  const productIds = pedido.pedido_items.map((item: ItemPedido) => item.product_id).filter((v: string | null): v is string => Boolean(v));
  const { data: disponibles } = await admin
    .from("products")
    .select("id")
    .in("id", productIds)
    .eq("is_active", true)
    .neq("stock_status", "out_of_stock");
  if (productIds.length !== pedido.pedido_items.length || (disponibles?.length ?? 0) !== new Set(productIds).size) {
    return { ok: false, error: "Alguno de los productos ya no está disponible. Escríbenos y lo resolvemos contigo." };
  }

  try {
    const preference = await crearPreferenciaPedido(
      {
        pedidoId: pedido.id,
        nombre: pedido.cliente_nombre,
        email: pedido.cliente_email,
        telefono: pedido.cliente_telefono ?? "",
        lineas: pedido.pedido_items.map((item: ItemPedido) => ({
          sku: item.sku,
          nombre: item.nombre,
          precio_unitario: Number(item.precio_unitario),
          cantidad: item.cantidad,
        })),
        descuento: Number(pedido.descuento ?? 0),
        descuentoVolumen: Number(pedido.descuento_volumen ?? 0),
        costoEnvio: Number(pedido.costo_envio),
        total: Number(pedido.total),
      },
      randomUUID()
    );
    await guardarPreferencia(admin, pedido.id, preference);
    return { ok: true, initPoint: preference.initPoint };
  } catch (err) {
    console.error("[pago] Error al crear la preferencia de reintento:", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
