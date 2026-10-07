import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeft, MapPin, MessageSquareText, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMXN, SHIPPING_METHODS } from "@/lib/pricing";
import { ESTADO_BADGE, folio, formatFecha, PEDIDO_DETALLE_COLUMNS } from "@/lib/pedidos";
import PedidoEstadoSelect from "@/components/admin/PedidoEstadoSelect";
import type { PedidoDetalle } from "@/lib/types";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function AdminPedidoDetallePage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  // RLS: el layout de /admin ya exige rol admin y las políticas de admin leen todos los pedidos.
  const supabase = await createClient();
  const { data } = await supabase.from("pedidos").select(PEDIDO_DETALLE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();

  const pedido = data as unknown as PedidoDetalle;
  const envio = SHIPPING_METHODS[pedido.metodo_envio];
  const d = pedido.direccion;
  const piezas = pedido.pedido_items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="space-y-4">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-black">
        <ChevronLeft size={16} /> Volver a pedidos
      </Link>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white p-6 shadow-card">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">Pedido #{folio(pedido.id)}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatFecha(pedido.fecha)} · {piezas} {piezas === 1 ? "pieza" : "piezas"}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[pedido.estado]}`}>
            {pedido.estado}
          </span>
          <PedidoEstadoSelect id={pedido.id} estado={pedido.estado} prominent />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
            <UserRound size={18} className="text-muted" /> Cliente
          </h2>
          <div className="space-y-0.5 text-sm text-black/60">
            <p className="font-semibold text-black">{pedido.cliente_nombre}</p>
            <p className="break-all">{pedido.cliente_email}</p>
            {pedido.cliente_telefono && <p>Tel. {pedido.cliente_telefono}</p>}
            <p className="pt-1 text-muted">{pedido.user_id ? "Con cuenta (suma botellas)" : "Compra como invitado"}</p>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
            <MapPin size={18} className="text-muted" /> Envío · {envio.label}
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
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Productos</h2>
        <ul className="divide-y divide-black/5">
          {pedido.pedido_items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-muted tabular-nums">
                  {item.sku} · {item.cantidad} × {formatMXN(Number(item.precio_unitario))}
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
            <span>Envío</span>
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

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
          <MessageSquareText size={18} className="text-muted" /> Notas del cliente
        </h2>
        {pedido.notas ? (
          <p className="whitespace-pre-line rounded-[20px] bg-canvas px-5 py-4 text-sm text-black/70">{pedido.notas}</p>
        ) : (
          <p className="text-sm text-muted">Sin notas para este pedido.</p>
        )}
      </section>
    </div>
  );
}
