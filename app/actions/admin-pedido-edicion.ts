"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { registrarBitacora } from "@/lib/pedido-admin";
import { METODO_PAGO_LABEL, METODOS_PAGO_PEDIDO } from "@/lib/pedido-pagos";
import { enlacePdfFirmado } from "@/lib/pedido-share";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
import { conLogoEmbebido } from "@/lib/email/logo-preview";
import {
  mensajePedidoActualizado,
  pdfAdjuntoPedido,
  procesarSincronizacion,
  sincronizarBotellasPedido,
} from "@/lib/lealtad-server";

export type AccionResult = { ok: true; mensaje?: string } | { ok: false; error: string };

const RUTA = "/admin/pedidos";
const dinero = z.coerce.number().min(0).max(100000).transform((n) => Math.round(n * 100) / 100);

// ─── Búsqueda de productos para agregar al pedido ────────────────────────────

export type ProductoParaPedido = { id: string; sku: string; name: string; sale_price: number; stock_status: string; is_active: boolean };

/** Busca en el inventario (activas e inactivas no retiradas) por nombre o SKU. Solo admins. */
export async function buscarProductosParaPedido(query: string): Promise<ProductoParaPedido[]> {
  const supabase = await requireAdmin(RUTA);
  const term = String(query ?? "")
    .replace(/[%_\\,()*]/g, " ")
    .trim()
    .slice(0, 60);
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, sale_price, stock_status, is_active")
    .eq("retirado", false)
    .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true })
    .limit(10);
  if (error) {
    console.error("[pedidos] Error al buscar productos:", error.message);
    return [];
  }
  return (data ?? []).map((p) => ({ ...p, sale_price: Number(p.sale_price) }));
}

// ─── Edición de renglones, envío y notas del cliente ─────────────────────────

const edicionSchema = z.object({
  pedidoId: z.uuid(),
  items: z
    .array(
      z.object({
        id: z.uuid().optional(),
        productId: z.uuid().optional(),
        cantidad: z.coerce.number().int().min(1).max(99),
        precioUnitario: dinero,
      }),
    )
    .min(1, "El pedido necesita al menos una cerveza.")
    .max(60),
  costoEnvio: dinero,
  notas: z.string().max(1000).default(""),
});

export type EdicionPedidoInput = z.input<typeof edicionSchema>;

/**
 * Edita renglones (agregar, quitar, cantidad y precio), envío y notas del cliente en una sola transacción
 * (`editar_pedido`, migración 036): recalcula totales, registra la bitácora y ajusta las botellas.
 * Nombre y SKU de lo agregado salen del inventario, nunca del navegador.
 */
export async function editarPedido(input: EdicionPedidoInput): Promise<AccionResult> {
  const parsed = edicionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const admin = createAdminClient();
  const { pedidoId, items, costoEnvio, notas } = parsed.data;

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, estado, metodo_pago, costo_envio, notas, total, pedido_items (id, product_id, sku, nombre, precio_unitario, cantidad)")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { ok: false, error: "No existe el pedido." };
  if (pedido.estado === "Cancelado") return { ok: false, error: "Un pedido cancelado no se puede editar." };
  // La preferencia de Mercado Pago ya tiene el monto original y el webhook exige que coincida.
  if (pedido.estado === "Pendiente" && (pedido.metodo_pago ?? "mercadopago") === "mercadopago") {
    return { ok: false, error: "Este pedido espera su pago en Mercado Pago. Edítalo cuando esté pagado, o cancélalo y crea uno nuevo." };
  }

  type Previo = { id: string; product_id: string | null; sku: string; nombre: string; precio_unitario: number; cantidad: number };
  const previos = new Map(((pedido.pedido_items ?? []) as Previo[]).map((i) => [i.id, i]));

  const nuevosIds = [...new Set(items.filter((i) => !i.id && i.productId).map((i) => i.productId as string))];
  const { data: productos } = nuevosIds.length
    ? await admin.from("products").select("id, sku, name").in("id", nuevosIds)
    : { data: [] as { id: string; sku: string; name: string }[] };
  const porId = new Map((productos ?? []).map((p) => [p.id, p]));

  const cambios: string[] = [];
  const pItems: Record<string, unknown>[] = [];
  for (const item of items) {
    if (item.id) {
      const previo = previos.get(item.id);
      if (!previo) return { ok: false, error: "Un renglón ya no existe; recarga la página." };
      pItems.push({ id: item.id, product_id: previo.product_id, sku: previo.sku, nombre: previo.nombre, precio_unitario: item.precioUnitario, cantidad: item.cantidad });
      if (previo.cantidad !== item.cantidad) cambios.push(`${normalCase(previo.nombre)}: ${previo.cantidad} → ${item.cantidad} pzas`);
      if (Number(previo.precio_unitario) !== item.precioUnitario) {
        cambios.push(`${normalCase(previo.nombre)}: precio ${formatMXN(Number(previo.precio_unitario))} → ${formatMXN(item.precioUnitario)}`);
      }
      previos.delete(item.id);
    } else {
      const producto = item.productId ? porId.get(item.productId) : undefined;
      if (!producto) return { ok: false, error: "Una cerveza agregada ya no existe en el inventario." };
      pItems.push({ product_id: producto.id, sku: producto.sku, nombre: producto.name, precio_unitario: item.precioUnitario, cantidad: item.cantidad });
      cambios.push(`Agregó ${item.cantidad} × ${normalCase(producto.name)} (${formatMXN(item.precioUnitario)})`);
    }
  }
  for (const quitado of previos.values()) cambios.push(`Quitó ${quitado.cantidad} × ${normalCase(quitado.nombre)}`);
  if (Number(pedido.costo_envio) !== costoEnvio) cambios.push(`Envío ${formatMXN(Number(pedido.costo_envio))} → ${formatMXN(costoEnvio)}`);
  if ((pedido.notas ?? "").trim() !== notas.trim()) cambios.push("Cambió las notas del cliente");
  if (cambios.length === 0) return { ok: true, mensaje: "No había cambios." };

  const { data, error } = await admin.rpc("editar_pedido", {
    p_pedido_id: pedidoId,
    p_items: pItems,
    p_costo_envio: costoEnvio,
    p_notas: notas,
    p_autor: autor,
    p_resumen: cambios.join(" · ").slice(0, 2000),
  });
  if (error) {
    console.error("[pedidos] Error al editar el pedido:", error.message);
    return { ok: false, error: "No se pudo guardar el pedido." };
  }
  const resultado = data as { status?: string; total?: number; total_anterior?: number; botellas?: unknown } | null;
  if (resultado?.status !== "editado") return { ok: false, error: "No se pudo guardar: el pedido cambió de estado." };
  const diferencia = await procesarSincronizacion(resultado.botellas);
  refresh();
  const botellas = diferencia ? ` Botellas ${diferencia > 0 ? "+" : ""}${diferencia}.` : "";
  return { ok: true, mensaje: `Guardado. Total ${formatMXN(Number(resultado.total_anterior))} → ${formatMXN(Number(resultado.total))}.${botellas}` };
}

// ─── Pagos ───────────────────────────────────────────────────────────────────

const pagoSchema = z.object({
  pedidoId: z.uuid(),
  metodo: z.enum(METODOS_PAGO_PEDIDO),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0.").max(100000),
  estado: z.enum(["pendiente", "recibido"]),
  referencia: z.string().trim().max(120).optional(),
});

/** Registra un pago adicional (pendiente o recibido). El pago original nunca se crea ni se borra aquí. */
export async function registrarPago(input: z.input<typeof pagoSchema>): Promise<AccionResult> {
  const parsed = pagoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const { pedidoId, metodo, monto, estado, referencia } = parsed.data;
  const admin = createAdminClient();
  const { data: pedido } = await admin.from("pedidos").select("estado").eq("id", pedidoId).maybeSingle();
  if (!pedido) return { ok: false, error: "No existe el pedido." };
  if (pedido.estado === "Cancelado") return { ok: false, error: "El pedido está cancelado." };
  const ahora = new Date().toISOString();
  const { error } = await admin.from("pedido_pagos").insert({
    pedido_id: pedidoId,
    metodo,
    monto: Math.round(monto * 100) / 100,
    estado,
    es_original: false,
    referencia: referencia || null,
    recibido_at: estado === "recibido" ? ahora : null,
    creado_por: autor,
  });
  if (error) {
    console.error("[pedidos] Error al registrar el pago:", error.message);
    return { ok: false, error: "No se pudo registrar el pago." };
  }
  await registrarBitacora(pedidoId, "Pago", `Pago adicional ${METODO_PAGO_LABEL[metodo]} ${formatMXN(monto)} (${estado})`, autor);
  if (estado === "recibido") await sincronizarBotellasPedido(pedidoId);
  refresh();
  return { ok: true };
}

async function leerPago(pagoId: string) {
  const { data } = await createAdminClient()
    .from("pedido_pagos")
    .select("id, pedido_id, metodo, monto, estado, es_original")
    .eq("id", pagoId)
    .maybeSingle();
  return data;
}

/** Marca un pago como recibido y suma las botellas que esperaban ese pago. */
export async function marcarPagoRecibido(pagoId: string): Promise<AccionResult> {
  if (!z.uuid().safeParse(pagoId).success) return { ok: false, error: "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const pago = await leerPago(pagoId);
  if (!pago) return { ok: false, error: "No existe el pago." };
  if (pago.estado === "recibido") return { ok: true };
  const { error } = await createAdminClient()
    .from("pedido_pagos")
    .update({ estado: "recibido", recibido_at: new Date().toISOString() })
    .eq("id", pagoId)
    .eq("estado", "pendiente");
  if (error) return { ok: false, error: "No se pudo actualizar el pago." };
  await registrarBitacora(pago.pedido_id, "Pago", `Recibido: ${METODO_PAGO_LABEL[pago.metodo as keyof typeof METODO_PAGO_LABEL]} ${formatMXN(Number(pago.monto))}`, autor);
  const diferencia = await sincronizarBotellasPedido(pago.pedido_id);
  refresh();
  return { ok: true, mensaje: diferencia ? `Pago recibido. Botellas +${diferencia}.` : "Pago recibido." };
}

/** Quita un pago adicional pendiente (registrado por error). El original y los recibidos no se borran. */
export async function quitarPagoPendiente(pagoId: string): Promise<AccionResult> {
  if (!z.uuid().safeParse(pagoId).success) return { ok: false, error: "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const pago = await leerPago(pagoId);
  if (!pago) return { ok: false, error: "No existe el pago." };
  if (pago.es_original || pago.estado !== "pendiente") return { ok: false, error: "Solo se puede quitar un pago adicional pendiente." };
  const { error } = await createAdminClient().from("pedido_pagos").delete().eq("id", pagoId).eq("estado", "pendiente").eq("es_original", false);
  if (error) return { ok: false, error: "No se pudo quitar el pago." };
  await registrarBitacora(pago.pedido_id, "Pago", `Quitó el pago pendiente ${METODO_PAGO_LABEL[pago.metodo as keyof typeof METODO_PAGO_LABEL]} ${formatMXN(Number(pago.monto))}`, autor);
  await sincronizarBotellasPedido(pago.pedido_id);
  refresh();
  return { ok: true };
}

// ─── Notas internas ──────────────────────────────────────────────────────────

const notaSchema = z.object({ pedidoId: z.uuid(), texto: z.string().trim().min(1, "Escribe la nota.").max(2000) });

/** Nota del equipo: solo se ve en el panel (nunca en /pedido, el PDF ni los correos). */
export async function agregarNotaInterna(pedidoId: string, texto: string): Promise<AccionResult> {
  const parsed = notaSchema.safeParse({ pedidoId, texto });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const { error } = await createAdminClient()
    .from("pedido_notas_internas")
    .insert({ pedido_id: parsed.data.pedidoId, texto: parsed.data.texto, autor });
  if (error) return { ok: false, error: "No se pudo guardar la nota." };
  await registrarBitacora(parsed.data.pedidoId, "Nota interna", parsed.data.texto.slice(0, 140), autor);
  refresh();
  return { ok: true };
}

// ─── PDF: compartir y enviar ─────────────────────────────────────────────────

/** Enlace firmado de solo lectura al PDF (7 días). */
export async function crearEnlacePdf(pedidoId: string): Promise<{ ok: true; url: string; expira: string } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(pedidoId).success) return { ok: false, error: "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const { url, expira } = enlacePdfFirmado(pedidoId);
  await registrarBitacora(pedidoId, "PDF", "Creó un enlace para compartir (7 días)", autor);
  return { ok: true, url, expira: expira.toISOString() };
}

/** Vista previa del correo «Actualizamos tu pedido» (destinatario, asunto y HTML). */
export async function vistaPreviaCorreoPedido(
  pedidoId: string,
): Promise<{ ok: true; to: string; subject: string; html: string } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(pedidoId).success) return { ok: false, error: "Datos inválidos." };
  await requireAdmin(RUTA);
  const mensaje = await mensajePedidoActualizado(pedidoId);
  if (!mensaje) return { ok: false, error: "No existe el pedido." };
  return { ok: true, to: mensaje.to, subject: mensaje.subject, html: await conLogoEmbebido(mensaje.html) };
}

/** Manda al cliente (correo del pedido) «Actualizamos tu pedido» con el PDF adjunto. */
export async function enviarPedidoAlCliente(pedidoId: string): Promise<AccionResult> {
  if (!z.uuid().safeParse(pedidoId).success) return { ok: false, error: "Datos inválidos." };
  const { email: autor } = await requireAdminUser(RUTA);
  const mensaje = await mensajePedidoActualizado(pedidoId);
  if (!mensaje) return { ok: false, error: "No existe el pedido." };
  const attachments = await pdfAdjuntoPedido(pedidoId);
  if (attachments.length === 0) return { ok: false, error: "No se pudo generar el PDF; no se envió el correo." };
  const enviado = await sendEmail({ ...mensaje, attachments });
  if (!enviado) return { ok: false, error: "No se pudo enviar el correo." };
  await registrarBitacora(pedidoId, "Correo", `«Actualizamos tu pedido» con PDF a ${mensaje.to}`, autor);
  refresh();
  return { ok: true, mensaje: `Enviado a ${mensaje.to}.` };
}

// ─── Contador «por enviar» (menú del panel) ──────────────────────────────────

/** Pedidos cobrados que falta enviar (estado Pagado). Lo consulta el menú cada 60 s y al volver a la pestaña. */
export async function contarPorEnviar(): Promise<number> {
  const supabase = await requireAdmin("/admin");
  const { count } = await supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "Pagado");
  return count ?? 0;
}
