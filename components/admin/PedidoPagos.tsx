"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard, Plus, Trash2 } from "lucide-react";
import { marcarPagoRecibido, quitarPagoPendiente, registrarPago } from "@/app/actions/admin-pedido-edicion";
import { METODO_PAGO_LABEL, METODOS_PAGO_PEDIDO, resumirPagos, type MetodoPagoPedido, type PedidoPago } from "@/lib/pedido-pagos";
import { formatMXN } from "@/lib/pricing";

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(iso));
const input = "min-h-11 w-full rounded-2xl bg-canvas px-3 text-sm outline-none focus:ring-2 focus:ring-black/15";

/** Historial de pagos del pedido: el original no se borra; los adicionales pueden quedar pendientes. */
export default function PedidoPagos({ pedidoId, total, pagos, cancelado }: { pedidoId: string; total: number; pagos: PedidoPago[]; cancelado: boolean }) {
  const resumen = resumirPagos(total, pagos);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<{ metodo: MetodoPagoPedido; monto: string; estado: "pendiente" | "recibido"; referencia: string }>({
    metodo: "transferencia",
    monto: "",
    estado: "pendiente",
    referencia: "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: true; mensaje?: string } | { ok: false; error: string }>, okText?: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.mensaje ?? okText ?? "Listo." } : { ok: false, text: r.error });
    });
  }

  function abrir() {
    setForm((f) => ({ ...f, monto: resumen.sinRegistrar > 0 ? String(resumen.sinRegistrar) : "" }));
    setAbierto(true);
  }

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <CreditCard size={18} className="text-muted" /> Pagos
          {resumen.pagoAdicionalPendiente && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Pago adicional pendiente</span>
          )}
        </h2>
        {!cancelado && !abierto && (
          <button type="button" onClick={abrir} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 px-5 text-sm font-semibold hover:bg-black/[0.04]">
            <Plus size={16} /> Registrar pago
          </button>
        )}
      </div>

      {pagos.length === 0 ? (
        <p className="text-sm text-muted">Sin pagos registrados.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {pagos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  {p.es_original ? "Pago original" : "Pago adicional"} · {METODO_PAGO_LABEL[p.metodo]}
                </p>
                <p className="text-muted">
                  {fecha(p.recibido_at ?? p.fecha)}
                  {p.referencia ? ` · Ref. ${p.referencia}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.estado === "recibido" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                  {p.estado === "recibido" ? "Recibido" : "Pendiente"}
                </span>
                <span className="w-24 text-right font-semibold tabular-nums">{formatMXN(p.monto)}</span>
                {p.estado === "pendiente" && !cancelado && (
                  <>
                    <button type="button" disabled={pending} onClick={() => run(() => marcarPagoRecibido(p.id))} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-black px-4 text-xs font-semibold text-white disabled:opacity-60">
                      <Check size={14} /> Marcar recibido
                    </button>
                    {!p.es_original && (
                      <button type="button" disabled={pending} onClick={() => run(() => quitarPagoPendiente(p.id), "Pago quitado.")} className="inline-flex size-11 items-center justify-center rounded-full bg-canvas hover:bg-black/10" aria-label="Quitar pago pendiente">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-black/5 pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Total del pedido</dt>
          <dd className="font-semibold tabular-nums">{formatMXN(total)}</dd>
        </div>
        <div>
          <dt className="text-muted">Recibido</dt>
          <dd className="font-semibold tabular-nums">{formatMXN(resumen.recibido)}</dd>
        </div>
        <div>
          <dt className="text-muted">Pendiente</dt>
          <dd className={`font-semibold tabular-nums ${resumen.pendiente > 0 ? "text-amber-800" : ""}`}>{formatMXN(resumen.pendiente)}</dd>
        </div>
        <div>
          <dt className="text-muted">{resumen.sinRegistrar >= 0 ? "Sin registrar" : "Excedente"}</dt>
          <dd className={`font-semibold tabular-nums ${resumen.sinRegistrar !== 0 ? "text-danger" : ""}`}>{formatMXN(Math.abs(resumen.sinRegistrar))}</dd>
        </div>
      </dl>

      {abierto && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await registrarPago({ pedidoId, ...form });
              if (r.ok) setAbierto(false);
              return r;
            }, "Pago registrado.");
          }}
          className="mt-4 grid gap-3 rounded-[20px] bg-canvas/60 p-4 sm:grid-cols-2"
        >
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Método
            <select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value as MetodoPagoPedido })} className={`${input} mt-1 bg-white font-normal normal-case text-black`}>
              {METODOS_PAGO_PEDIDO.map((m) => (
                <option key={m} value={m}>
                  {METODO_PAGO_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Monto (MXN)
            <input required inputMode="decimal" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value.replace(/[^\d.]/g, "") })} className={`${input} mt-1 bg-white font-normal normal-case text-black`} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Estado
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as "pendiente" | "recibido" })} className={`${input} mt-1 bg-white font-normal normal-case text-black`}>
              <option value="pendiente">Pendiente</option>
              <option value="recibido">Recibido</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Referencia (opcional)
            <input value={form.referencia} maxLength={120} onChange={(e) => setForm({ ...form, referencia: e.target.value })} className={`${input} mt-1 bg-white font-normal normal-case text-black`} />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Guardando…" : "Guardar pago"}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-black/70 hover:bg-black/[0.05]">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-black/70" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
