import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGO_VIGENCIA_HORAS } from "@/lib/mercadopago-checkout";

export const dynamic = "force-dynamic";

/**
 * Margen tras el vencimiento: un pago de OXXO o SPEI hecho a última hora puede tardar en confirmarse.
 * Si aun así llega un pago de un pedido ya cancelado, el webhook avisa al dueño (`pagado_cancelado`).
 */
const GRACIA_HORAS = 48;
const HORA_MS = 60 * 60 * 1000;

type PendienteMp = { id: string; fecha: string; pago_expira_at?: string | null };

function autorizado(request: Request, secret: string): boolean {
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secret}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

/**
 * Tarea diaria (Vercel Cron, ver vercel.json): cancela los pedidos de Mercado Pago que siguen
 * Pendientes después de vencer su enlace de pago, con la misma función SQL que usa el admin
 * (`cancelar_pedido_pendiente`: cancela y devuelve el uso del cupón, idempotente).
 * Los pedidos por transferencia no se tocan: esos los confirma o cancela el admin al revisar depósitos.
 * No envía correo al cliente.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] Falta CRON_SECRET; no se cancela nada.");
    return NextResponse.json({ error: "No configurado." }, { status: 503 });
  }
  if (!autorizado(request, secret)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  let pendientes: PendienteMp[] | null = null;
  const conVencimiento = await admin
    .from("pedidos")
    .select("id, fecha, pago_expira_at")
    .eq("estado", "Pendiente")
    .eq("metodo_pago", "mercadopago");
  if (conVencimiento.error) {
    // Sin la migración 025 todavía: se usa solo la fecha del pedido.
    const soloFecha = await admin
      .from("pedidos")
      .select("id, fecha")
      .eq("estado", "Pendiente")
      .eq("metodo_pago", "mercadopago");
    if (soloFecha.error) {
      console.error("[cron] No se pudieron leer los pendientes:", soloFecha.error.message);
      return NextResponse.json({ error: "Error temporal." }, { status: 500 });
    }
    pendientes = soloFecha.data;
  } else {
    pendientes = conVencimiento.data;
  }

  const ahora = Date.now();
  const vencidos = (pendientes ?? []).filter((p) => {
    const expira = p.pago_expira_at
      ? new Date(p.pago_expira_at).getTime()
      : new Date(p.fecha).getTime() + PAGO_VIGENCIA_HORAS * HORA_MS;
    return expira + GRACIA_HORAS * HORA_MS < ahora;
  });

  let cancelados = 0;
  for (const pedido of vencidos) {
    const { data, error } = await admin.rpc("cancelar_pedido_pendiente", { p_pedido_id: pedido.id });
    if (error) {
      console.error("[cron] No se pudo cancelar el pedido", pedido.id, error.message);
      continue;
    }
    if ((data as { status?: string } | null)?.status === "cancelado") cancelados += 1;
  }

  console.info(`[cron] Pendientes de Mercado Pago revisados: ${pendientes?.length ?? 0}; cancelados: ${cancelados}.`);
  return NextResponse.json({ revisados: pendientes?.length ?? 0, cancelados });
}
