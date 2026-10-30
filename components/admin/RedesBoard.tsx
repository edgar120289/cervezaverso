"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ImageUp, Loader2, Pencil, Plus, Send, Trash2, Undo2, X } from "lucide-react";
import {
  borrarPublicacion,
  cambiarEstadoPublicacion,
  guardarPublicacion,
  publicarAhora,
  type RedesResult,
} from "@/app/actions/admin-redes";
import { createClient } from "@/lib/supabase/client";
import {
  cdmxLocalToIso,
  formatCdmx,
  isoToCdmxLocal,
  FORMATOS,
  REDES,
  REDES_BUCKET,
  type Publicacion,
  type Formato,
  type Red,
} from "@/lib/redes";

const ESTADO: Record<Publicacion["estado"], { label: string; tone: string }> = {
  borrador: { label: "Por aprobar", tone: "bg-amber-100 text-amber-900" },
  aprobada: { label: "Programada", tone: "bg-accent/10 text-accent" },
  publicando: { label: "Publicando…", tone: "bg-accent/10 text-accent" },
  publicada: { label: "Publicada", tone: "bg-green-100 text-green-900" },
  error: { label: "Con error", tone: "bg-red-100 text-red-900" },
};
const RED_LABEL: Record<Red, string> = { instagram: "Instagram", facebook: "Facebook" };

const btn = "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50";
const input = "min-h-11 w-full rounded-2xl bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

/**
 * Instagram exige JPG; en el muro, proporción entre 4:5 (vertical) y 1.91:1 (horizontal); en historias, 9:16 ideal.
 * Se convierte en el navegador.
 */
async function aJpg(file: File, historia: boolean): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = bitmap.height / bitmap.width;
  if (!historia && (ratio > 1.26 || ratio < 0.52)) {
    throw new Error("Instagram acepta imágenes entre 4:5 (vertical, 1080×1350) y 1.91:1 (horizontal).");
  }
  const scale = Math.min(1, (historia ? 1080 : 1440) / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo convertir la imagen."))), "image/jpeg", 0.9),
  );
}

type Draft = { titulo: string; caption: string; imagenes: string[]; redes: Red[]; formato: Formato; fecha: string };
const FORMATO_LABEL: Record<Formato, string> = { feed: "Publicación", historia: "Historia (24 h)" };

function draftDe(p?: Publicacion): Draft {
  const manana = new Date(Date.now() + 24 * 3600 * 1000);
  manana.setUTCHours(1, 0, 0, 0); // 19:00 de CDMX
  return {
    titulo: p?.titulo ?? "",
    caption: p?.caption ?? "",
    imagenes: p?.imagenes ?? [],
    redes: p?.redes ?? ["instagram", "facebook"],
    formato: p?.formato ?? "feed",
    fecha: isoToCdmxLocal(p?.programada_para ?? manana.toISOString()),
  };
}

function Editor({ publicacion, onDone }: { publicacion?: Publicacion; onDone: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => draftDe(publicacion));
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setSubiendo(true);
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of files.slice(0, 10 - draft.imagenes.length)) {
        const blob = await aJpg(file, draft.formato === "historia");
        const path = `${Date.now()}-${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(REDES_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from(REDES_BUCKET).getPublicUrl(path).data.publicUrl);
      }
      setDraft((d) => ({ ...d, imagenes: [...d.imagenes, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  function mover(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= draft.imagenes.length) return;
    const next = [...draft.imagenes];
    [next[i], next[j]] = [next[j], next[i]];
    set({ imagenes: next });
  }

  function guardar(aprobar: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await guardarPublicacion(
        {
          id: publicacion?.id,
          titulo: draft.titulo,
          caption: draft.caption,
          imagenes: draft.imagenes,
          redes: draft.redes,
          formato: draft.formato,
          programada_para: cdmxLocalToIso(draft.fecha),
        },
        aprobar,
      );
      if (!result.ok) setError(result.error);
      else onDone();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {draft.imagenes.map((url, i) => (
          <div key={url} className="relative h-36 w-[115px] overflow-hidden rounded-2xl bg-canvas ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button type="button" onClick={() => mover(i, -1)} aria-label="Mover a la izquierda" className="rounded-full bg-white/90 p-1.5">
                <ArrowLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => set({ imagenes: draft.imagenes.filter((_, k) => k !== i) })}
                aria-label={`Quitar imagen ${i + 1}`}
                className="rounded-full bg-white/90 p-1.5 text-danger"
              >
                <X size={13} />
              </button>
              <button type="button" onClick={() => mover(i, 1)} aria-label="Mover a la derecha" className="rounded-full bg-white/90 p-1.5">
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
        {draft.imagenes.length < 10 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={subiendo}
            className="flex h-36 w-[115px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 text-xs font-semibold text-muted hover:bg-canvas"
          >
            {subiendo ? <Loader2 size={18} className="animate-spin" /> : <ImageUp size={18} />}
            {subiendo ? "Subiendo…" : "Agregar imagen"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={subir} />
      </div>
      <p className="text-xs text-muted">Varias imágenes = carrusel (en ese orden). Mejor en 1080×1350; se convierten a JPG solas.</p>

      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        Título (solo lo ves tú)
        <input value={draft.titulo} onChange={(e) => set({ titulo: e.target.value })} maxLength={120} className={`${input} mt-1 font-normal normal-case tracking-normal`} />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        Texto de la publicación ({draft.caption.length}/2,200)
        <textarea
          value={draft.caption}
          onChange={(e) => set({ caption: e.target.value })}
          maxLength={2200}
          rows={7}
          spellCheck
          lang="es"
          className={`${input} mt-1 py-3 font-normal normal-case tracking-normal`}
        />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Fecha y hora (CDMX)
          <input type="datetime-local" value={draft.fecha} onChange={(e) => set({ fecha: e.target.value })} className={`${input} mt-1 font-normal`} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Formato
          <select value={draft.formato} onChange={(e) => set({ formato: e.target.value as Formato })} className={`${input} mt-1 font-normal`}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {FORMATO_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex gap-2">
          <legend className="sr-only">Redes</legend>
          {REDES.map((red) => {
            const on = draft.redes.includes(red);
            return (
              <label key={red} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold ${on ? "bg-black text-white" : "bg-canvas"}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => set({ redes: on ? draft.redes.filter((r) => r !== red) : [...draft.redes, red] })}
                  className="sr-only"
                />
                {RED_LABEL[red]}
              </label>
            );
          })}
        </fieldset>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => guardar(true)} disabled={pending || subiendo} className={`${btn} bg-accent text-white shadow-accent`}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Guardar y aprobar
        </button>
        <button type="button" onClick={() => guardar(false)} disabled={pending || subiendo} className={`${btn} bg-canvas`}>
          Guardar como borrador
        </button>
        <button type="button" onClick={onDone} className={`${btn} text-muted`}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Tarjeta({ p }: { p: Publicacion }) {
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editable = p.estado === "borrador" || p.estado === "aprobada" || p.estado === "error";

  function run(action: () => Promise<RedesResult>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <li className="space-y-3 rounded-[28px] bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO[p.estado].tone}`}>{ESTADO[p.estado].label}</span>
        <span className="text-sm font-semibold">{formatCdmx(p.publicada_at ?? p.programada_para)}</span>
        <span className="text-xs text-muted">{p.redes.map((r) => RED_LABEL[r]).join(" + ")}</span>
        {p.formato === "historia" && <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">Historia</span>}
      </div>
      {editando ? (
        <Editor publicacion={p} onDone={() => setEditando(false)} />
      ) : (
        <>
          <p className="font-semibold">{p.titulo}</p>
          {p.nota && <p className="text-sm font-semibold text-amber-700">{p.nota}</p>}
          {p.error && <p className="text-sm text-danger">{p.error}</p>}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {p.imagenes.length === 0 && <p className="text-sm text-danger">Sin imágenes.</p>}
            {p.imagenes.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`Imagen ${i + 1}`} loading="lazy" className="h-36 w-[115px] shrink-0 rounded-2xl bg-canvas object-cover ring-1 ring-black/10" />
            ))}
          </div>
          <p className="max-h-32 overflow-y-auto whitespace-pre-line text-sm text-black/80">{p.caption || "Sin texto."}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          {editable && (
            <div className="flex flex-wrap gap-2">
              {p.estado !== "aprobada" ? (
                <button type="button" disabled={pending} onClick={() => run(() => cambiarEstadoPublicacion(p.id, "aprobada"))} className={`${btn} bg-accent text-white`}>
                  <Check size={16} /> Aprobar
                </button>
              ) : (
                <button type="button" disabled={pending} onClick={() => run(() => cambiarEstadoPublicacion(p.id, "borrador"))} className={`${btn} bg-canvas`}>
                  <Undo2 size={16} /> Regresar a borrador
                </button>
              )}
              <button type="button" onClick={() => setEditando(true)} className={`${btn} bg-canvas`}>
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => publicarAhora(p.id), "Se publicará en los próximos 15 minutos. ¿Continuar?")}
                className={`${btn} bg-canvas`}
              >
                <Send size={16} /> Publicar ahora
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => borrarPublicacion(p.id), "¿Borrar esta publicación?")}
                className={`${btn} text-danger`}
              >
                <Trash2 size={16} /> Borrar
              </button>
              {pending && <Loader2 size={18} className="animate-spin self-center" />}
            </div>
          )}
        </>
      )}
    </li>
  );
}

/** Tablero de /admin/redes: por aprobar, programadas y publicadas. */
export default function RedesBoard({ publicaciones }: { publicaciones: Publicacion[] }) {
  const [nueva, setNueva] = useState(false);
  const grupos: { titulo: string; items: Publicacion[] }[] = [
    { titulo: "Por aprobar", items: publicaciones.filter((p) => p.estado === "borrador" || p.estado === "error") },
    { titulo: "Programadas", items: publicaciones.filter((p) => p.estado === "aprobada" || p.estado === "publicando") },
    { titulo: "Publicadas", items: publicaciones.filter((p) => p.estado === "publicada").reverse() },
  ];

  return (
    <div className="space-y-8">
      {nueva ? (
        <div className="rounded-[28px] bg-white p-5 shadow-card">
          <Editor onDone={() => setNueva(false)} />
        </div>
      ) : (
        <button type="button" onClick={() => setNueva(true)} className={`${btn} bg-ink text-white`}>
          <Plus size={16} /> Nueva publicación
        </button>
      )}
      {grupos.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <h3 className="font-semibold tracking-tight">
            {g.titulo} <span className="text-muted">({g.items.length})</span>
          </h3>
          {g.items.length === 0 ? (
            <p className="text-sm text-muted">Nada por aquí.</p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {g.items.map((p) => (
                <Tarjeta key={p.id} p={p} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
