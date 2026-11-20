import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeft, History, MapPin, MessageSquareText, Truck, UserRound, Wine } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { SHIPPING_METHODS } from "@/lib/pricing";
import { ESTADO_BADGE, folio, formatFecha } from "@/lib/pedidos";
import { getPedidoCompleto, getPedidoInterno } from "@/lib/pedido-admin";
import { resumirPagos } from "@/lib/pedido-pagos";
import PedidoEstadoSelect from "@/components/admin/PedidoEstadoSelect";
import CancelPendingButton from "@/components/admin/CancelPendingButton";
import ResendEmailButton from "@/components/admin/ResendEmailButton";
import GuiaForm from "@/components/admin/GuiaForm";
import PedidoEditor from "@/components/admin/PedidoEditor";
import PedidoPagos from "@/components/admin/PedidoPagos";
import NotasInternas from "@/components/admin/NotasInternas";
import PedidoDocumentoAcciones from "@/components/admin/PedidoDocumentoAcciones";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function AdminPedidoDetallePage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  // Pagos, notas internas y bitácora son solo del service role: se exige admin antes de leerlos.
  await requireAdmin(`/admin/pedidos/${id}`);
  const [completo, interno] = await Promise.all([getPedidoCompleto(id), getPedidoInterno(id)]);
  if (!completo) notFound();

  const { pedido, pagos } = completo;
  const resumen = resumirPagos(Number(pedido.total), pagos);
  const bloqueo =
    pedido.estado === "Cancelado"
      ? "Un pedido cancelado no se edita."
      : pedido.estado === "Pendiente" && (pedido.metodo_pago ?? "mercadopago") === "mercadopago"
        ? "Espera su pago en Mercado Pago: se edita cuando esté pagado."
        : null;
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
          <span className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[pedido.estado]}`}>{pedido.estado}</span>
            {resumen.pagoAdicionalPendiente && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Pago adicional pendiente</span>
            )}
          </span>
          <PedidoEstadoSelect id={pedido.id} estado={pedido.estado} prominent />
          {pedido.estado === "Pendiente" && <CancelPendingButton id={pedido.id} promoCode={pedido.promo_code ?? null} />}
          {["Pagado", "Enviado", "Cancelado"].includes(pedido.estado) && <ResendEmailButton id={pedido.id} />}
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

      <PedidoEditor
        pedidoId={pedido.id}
        items={pedido.pedido_items.map((i) => ({
          id: i.id,
          sku: i.sku,
          nombre: i.nombre,
          precio_unitario: Number(i.precio_unitario),
          cantidad: i.cantidad,
          importe: Number(i.importe),
          agregado: Boolean(i.agregado),
        }))}
        subtotal={Number(pedido.subtotal)}
        descuento={Number(pedido.descuento ?? 0)}
        promoCode={pedido.promo_code ?? null}
        descuentoVolumen={Number(pedido.descuento_volumen ?? 0)}
        costoEnvio={Number(pedido.costo_envio)}
        total={Number(pedido.total)}
        notas={pedido.notas ?? ""}
        bloqueo={bloqueo}
      />

      <PedidoPagos pedidoId={pedido.id} total={Number(pedido.total)} pagos={pagos} cancelado={pedido.estado === "Cancelado"} />

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="mb-2 flex items-center gap-2 font-semibold tracking-tight">
          <Wine size={18} className="text-muted" /> Botellas
        </h2>
        <p className="text-sm text-black/70">
          {!pedido.user_id
            ? "Compra como invitado: no suma botellas (se ligan si el cliente crea su cuenta con este correo)."
            : pedido.botellas_acreditadas_at
              ? `${pedido.botellas_acreditadas ?? 0} de ${piezas} piezas acreditadas a la cuenta.${
                  (pedido.botellas_acreditadas ?? 0) < piezas && resumen.pagoAdicionalPendiente ? " El resto se suma al recibir el pago adicional." : ""
                }`
              : `Sin acreditar: ${piezas} botellas se suman al marcarse Pagado.`}
        </p>
      </section>

      <PedidoDocumentoAcciones pedidoId={pedido.id} folio={folio(pedido.id)} />

      {pedido.estado !== "Pendiente" && pedido.estado !== "Cancelado" && (
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="mb-1 flex items-center gap-2 font-semibold tracking-tight">
            <Truck size={18} className="text-muted" /> Guía de envío
          </h2>
          <p className="mb-4 text-sm text-muted">El cliente la recibe en su correo de «Tu pedido va en camino» y la ve en su pedido.</p>
          <GuiaForm
            id={pedido.id}
            estado={pedido.estado}
            inicial={{ paqueteria: pedido.paqueteria ?? "", guia: pedido.guia ?? "", guia_url: pedido.guia_url ?? "" }}
          />
        </section>
      )}

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

      <NotasInternas pedidoId={pedido.id} notas={interno.notas} />

      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
          <History size={18} className="text-muted" /> Historial de cambios
        </h2>
        {interno.bitacora.length === 0 ? (
          <p className="text-sm text-muted">Sin cambios registrados.</p>
        ) : (
          <ol className="space-y-3 border-l-2 border-black/5 pl-4">
            {interno.bitacora.map((b) => (
              <li key={b.id} className="text-sm">
                <p>
                  <span className="font-semibold">{b.accion}</span>
                  {b.detalle ? <span className="text-black/70"> · {b.detalle}</span> : null}
                </p>
                <p className="text-xs text-muted">
                  {b.autor ?? "sistema"} · {formatFecha(b.created_at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
