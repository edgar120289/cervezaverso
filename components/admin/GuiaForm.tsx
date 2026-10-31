"use client";

import { useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { guardarGuia } from "@/app/actions/admin-pedidos";

const PAQUETERIAS = ["Estafeta", "DHL", "FedEx", "Paquetexpress", "Redpack", "99 Minutos", "J&T Express", "Mensajería propia"];
const input = "min-h-11 w-full rounded-2xl bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

/** Captura de la guía en el detalle del pedido: al guardarla se marca Enviado y el correo la lleva. */
export default function GuiaForm({
  id,
  estado,
  inicial,
}: {
  id: string;
  estado: string;
  inicial: { paqueteria: string; guia: string; guia_url: string };
}) {
  const [form, setForm] = useState(inicial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const accion =
    estado === "Pagado" ? "Guardar y marcar como Enviado" : estado === "Enviado" ? "Guardar y reenviar aviso" : "Guardar guía";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await guardarGuia({ id, ...form });
      setMsg(r.ok ? { ok: true, text: estado === "Pagado" || estado === "Enviado" ? "Guía guardada y correo enviado al cliente." : "Guía guardada." } : { ok: false, text: r.error });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Paquetería
          <input list="paqueterias" required value={form.paqueteria} onChange={set("paqueteria")} className={`${input} mt-1 font-normal normal-case`} />
          <datalist id="paqueterias">
            {PAQUETERIAS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Número de guía
          <input required value={form.guia} onChange={set("guia")} className={`${input} mt-1 font-normal normal-case`} />
        </label>
      </div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        Enlace de rastreo (opcional)
        <input type="url" placeholder="https://" value={form.guia_url} onChange={set("guia_url")} className={`${input} mt-1 font-normal normal-case`} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Truck size={16} /> {pending ? "Guardando…" : accion}
        </button>
        {msg && (
          <p role="status" className={`text-sm ${msg.ok ? "text-muted" : "text-danger"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
