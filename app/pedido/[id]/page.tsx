import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleX, MapPin, MessageSquareText, Truck } from "lucide-react";
import { z } from "zod";
import ClearCart from "@/components/ClearCart";
import RetryPaymentButton from "@/components/RetryPaymentButton";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMXN, SHIPPING_METHODS } from "@/lib/pricing";
import { ESTADO_BADGE, folio, formatFecha, PEDIDO_DETALLE_COLUMNS } from "@/lib/pedidos";
import type { PedidoDetalle } from "@/lib/types";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

/**
 * Confirmación y detalle del pedido. Se lee con service_role porque los
 * pedidos de invitados no tienen dueño en RLS: para ellos el UUID (no
 * adivinable) del enlace es la llave. Un pedido ligado a una cuenta sólo lo
 * ve su dueño.
 */
async function getPedido(id: string): Promise<PedidoDetalle | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const { data } = await createAdminClient()
    .from("pedidos")
    .select(PEDIDO_DETALLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  if (data.user_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== data.user_id) return null;
  }

  return data as unknown as PedidoDetalle;
}

export default async function PedidoPage({ params, searchParams }: PageProps<"/pedido/[id]">) {
  const [{ id }, { pago }] = await Promise.all([params, searchParams]);
  const pedido = await getPedido(id);
  if (!pedido) notFound();

  // `pago` solo decide el mensaje al volver de Mercado Pago; el estado real viene de la base (webhook).
  const esNuevo = pago === "exitoso" || pago === "pendiente";
  const fallido = pago === "fallido";
  const confirmado = pedido.estado !== "Pendiente";
  const envio = SHIPPING_METHODS[pedido.metodo_envio];
  const d = pedido.direccion;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      {esNuevo ? (
        <section className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-10 text-center shadow-card">
          <ClearCart />
          <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-white shadow-accent">
            <CircleCheck size={28} />
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">¡Gracias por tu pedido!</h1>
          <p className="max-w-md text-muted">
            {confirmado
              ? "Recibimos tu pago del pedido "
              : "Estamos confirmando el pago del pedido "}
            <span className="font-semibold text-black">#{folio(pedido.id)}</span>. Te avisaremos en{" "}
            <span className="font-semibold text-black">{pedido.cliente_email}</span> en cuanto quede confirmado.
          </p>
        </section>
      ) : fallido ? (
        <section className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-10 text-center shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-black/5 text-black/60">
            <CircleX size={28} />
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">El pago no se completó</h1>
          <p className="max-w-md text-muted">
            No se hizo ningún cargo. Tu pedido sigue guardado: puedes intentar pagar de nuevo.
          </p>
        </section>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Pedido #{folio(pedido.id)}</h1>
          <Link href="/cuenta" className="text-sm font-semibold text-muted hover:text-black">
            ← Mis pedidos
          </Link>
        </div>
      )}

      {pedido.estado === "Pendiente" && !esNuevo && (
        <section className="flex flex-col items-center gap-3 rounded-[28px] bg-white p-6 text-center shadow-card">
          <p className="text-sm text-muted">Este pedido está pendiente de pago.</p>
          <RetryPaymentButton pedidoId={pedido.id} />
        </section>
      )}

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Resumen de la compra</h2>
          <div className="flex items-center gap-2 text-sm text-muted">
            {formatFecha(pedido.fecha)}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[pedido.estado]}`}>
              {pedido.estado}
            </span>
          </div>
        </div>

        <ul className="divide-y divide-black/5">
          {pedido.pedido_items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-muted tabular-nums">
                  {item.cantidad} × {formatMXN(Number(item.precio_unitario))}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{formatMXN(Number(item.importe))}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2 space-y-2 border-t border-black/5 pt-4 text-sm">
          <div className="flex justify-between text-black/60">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMXN(Number(pedido.subtotal))}</span>
          </div>
          {Number(pedido.descuento ?? 0) > 0 && (
            <div className="flex justify-between font-semibold text-accent">
              <span>Descuento{pedido.promo_code ? ` (${pedido.promo_code})` : ""}</span>
              <span className="tabular-nums">−{formatMXN(Number(pedido.descuento))}</span>
            </div>
          )}
          <div className="flex justify-between text-black/60">
            <span>{envio.label}</span>
            <span className="tabular-nums">
              {Number(pedido.costo_envio) === 0 ? "Gratis" : formatMXN(Number(pedido.costo_envio))}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMXN(Number(pedido.total))}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
            <MapPin size={18} className="text-muted" /> Envío a
          </h2>
          {d ? (
            <div className="space-y-0.5 text-sm text-black/60">
              <p className="font-semibold text-black">{d.nombre_completo}</p>
              <p>{d.calle}</p>
              <p>
                {d.colonia}, {d.ciudad}
              </p>
              <p>
                {d.estado}, C.P. {d.codigo_postal}
              </p>
              <p>Tel. {d.telefono}</p>
              {d.referencias && <p className="pt-1 text-muted">Ref.: {d.referencias}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">Sin dirección registrada.</p>
          )}
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
            <Truck size={18} className="text-muted" /> Método de envío
          </h2>
          <p className="text-sm font-semibold">{envio.label}</p>
          <p className="text-sm text-muted">
            {pedido.metodo_envio === "local"
              ? "Sin costo · Entrega en 2 a 3 días hábiles."
              : "Paquetería a toda la República."}
          </p>
        </section>
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
          <MessageSquareText size={18} className="text-muted" /> Notas o instrucciones especiales
        </h2>
        {pedido.notas ? (
          <p className="whitespace-pre-line rounded-[20px] bg-canvas px-5 py-4 text-sm text-black/70">
            {pedido.notas}
          </p>
        ) : (
          <p className="text-sm text-muted">Sin notas para este pedido.</p>
        )}
      </section>

      {esNuevo && (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-accent px-7 py-3.5 text-center font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
          >
            Seguir comprando
          </Link>
          <Link
            href="/cuenta"
            className="rounded-full bg-white px-7 py-3.5 text-center font-semibold shadow-card transition-transform active:scale-[0.98]"
          >
            Ver mis pedidos
          </Link>
        </div>
      )}
    </div>
  );
}
