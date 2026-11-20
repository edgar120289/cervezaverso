"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { agregarNotaInterna } from "@/app/actions/admin-pedido-edicion";
import type { NotaInterna } from "@/lib/pedido-admin";

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(iso));

/** Notas del equipo: solo se ven aquí, nunca en la página del cliente, el PDF ni los correos. */
export default function NotasInternas({ pedidoId, notas }: { pedidoId: string; notas: NotaInterna[] }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card">
      <h2 className="mb-1 flex items-center gap-2 font-semibold tracking-tight">
        <Lock size={18} className="text-muted" /> Notas internas
      </h2>
      <p className="mb-4 text-sm text-muted">Solo las ve el equipo. El cliente nunca las ve.</p>
      {notas.length > 0 && (
        <ul className="mb-4 space-y-2">
          {notas.map((n) => (
            <li key={n.id} className="rounded-[20px] bg-amber-50 px-5 py-3 text-sm">
              <p className="whitespace-pre-line text-black/80">{n.texto}</p>
              <p className="mt-1 text-xs text-muted">
                {n.autor ?? "admin"} · {fecha(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const r = await agregarNotaInterna(pedidoId, texto);
            if (r.ok) setTexto("");
            else setError(r.error);
          });
        }}
        className="space-y-3"
      >
        <label className="sr-only" htmlFor="nota-interna">
          Nueva nota interna
        </label>
        <textarea
          id="nota-interna"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Ej.: el cliente pagará el adicional por transferencia el viernes."
          className="w-full rounded-2xl bg-canvas px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15"
        />
        <button type="submit" disabled={pending || !texto.trim()} className="inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Guardando…" : "Agregar nota"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </section>
  );
}
