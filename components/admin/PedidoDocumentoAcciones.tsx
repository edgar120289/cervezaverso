"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Copy, Download, FileText, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import { crearEnlacePdf, enviarPedidoAlCliente, vistaPreviaCorreoPedido } from "@/app/actions/admin-pedido-edicion";

const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 px-5 text-sm font-semibold hover:bg-black/[0.04] disabled:opacity-60";

type Enlace = { url: string; expira: string };
type Vista = { to: string; subject: string; html: string };

/** PDF del pedido: descargar, compartir (menú nativo en celular; enlace, WhatsApp y correo en PC) y enviar al cliente. */
export default function PedidoDocumentoAcciones({ pedidoId, folio }: { pedidoId: string; folio: string }) {
  const pdfUrl = `/api/admin/pedidos/${pedidoId}/pdf`;
  const [enlace, setEnlace] = useState<Enlace | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (vista) dialogRef.current?.showModal();
  }, [vista]);

  async function compartirNativo(): Promise<boolean> {
    if (typeof navigator.share !== "function" || !window.matchMedia("(pointer: coarse)").matches) return false;
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) return false;
      const file = new File([await res.blob()], `cervezaverso-pedido-${folio}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Pedido #${folio} · Cervezaverso` });
        return true;
      }
      return false;
    } catch (err) {
      // El usuario cerró el menú: no es error.
      return err instanceof DOMException && err.name === "AbortError";
    }
  }

  function compartir() {
    setMsg(null);
    startTransition(async () => {
      if (await compartirNativo()) return;
      const r = await crearEnlacePdf(pedidoId);
      if (r.ok) setEnlace({ url: r.url, expira: r.expira });
      else setMsg({ ok: false, text: r.error });
    });
  }

  function abrirVista() {
    setMsg(null);
    startTransition(async () => {
      const r = await vistaPreviaCorreoPedido(pedidoId);
      if (r.ok) setVista(r);
      else setMsg({ ok: false, text: r.error });
    });
  }

  function enviar() {
    startTransition(async () => {
      const r = await enviarPedidoAlCliente(pedidoId);
      dialogRef.current?.close();
      setVista(null);
      setMsg(r.ok ? { ok: true, text: r.mensaje ?? "Enviado." } : { ok: false, text: r.error });
    });
  }

  const textoCompartir = enlace ? `Pedido #${folio} de Cervezaverso (PDF): ${enlace.url}` : "";
  const vence = enlace
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(new Date(enlace.expira))
    : "";

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card">
      <h2 className="mb-1 flex items-center gap-2 font-semibold tracking-tight">
        <FileText size={18} className="text-muted" /> PDF del pedido
      </h2>
      <p className="mb-4 text-sm text-muted">Con logo, productos, pagos, botellas y guía. No incluye notas internas.</p>
      <div className="flex flex-wrap gap-2">
        <a href={`${pdfUrl}?descargar=1`} className={`${btn} bg-accent text-white border-accent hover:bg-accent/90`}>
          <Download size={16} /> Descargar PDF
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener" className={btn}>
          <FileText size={16} /> Ver
        </a>
        <button type="button" onClick={compartir} disabled={pending} className={btn}>
          <Share2 size={16} /> Compartir
        </button>
        <button type="button" onClick={abrirVista} disabled={pending} className={btn}>
          <Send size={16} /> Enviar al cliente
        </button>
      </div>

      {enlace && (
        <div className="mt-4 space-y-3 rounded-[20px] bg-canvas p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-black/70">Enlace de solo lectura, vence el {vence}.</p>
            <button type="button" onClick={() => setEnlace(null)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/10" aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
          <input readOnly value={enlace.url} onFocus={(e) => e.currentTarget.select()} className="min-h-11 w-full rounded-2xl bg-white px-3 text-xs" aria-label="Enlace al PDF" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(enlace.url);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className={`${btn} bg-white`}
            >
              <Copy size={16} /> {copiado ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(textoCompartir)}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-white`}>
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(`Pedido #${folio} · Cervezaverso`)}&body=${encodeURIComponent(textoCompartir)}`} className={`${btn} bg-white`}>
              <Mail size={16} /> Correo
            </a>
          </div>
        </div>
      )}

      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-black/70" : "text-danger"}`}>
          {msg.text}
        </p>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setVista(null)}
        className="m-auto w-[min(640px,calc(100vw-32px))] rounded-[28px] bg-white p-0 shadow-xl backdrop:bg-black/40"
        aria-labelledby="vista-correo-titulo"
      >
        {vista && (
          <div className="flex max-h-[85vh] flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-black/5 p-5">
              <div className="min-w-0 text-sm">
                <h2 id="vista-correo-titulo" className="text-base font-semibold">
                  Vista previa del correo
                </h2>
                <p className="mt-1 break-all text-muted">
                  Para: <strong className="text-black">{vista.to}</strong>
                </p>
                <p className="text-muted">Asunto: {vista.subject}</p>
                <p className="text-muted">Adjunto: cervezaverso-pedido-{folio}.pdf</p>
              </div>
              <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/10" aria-label="Cerrar vista previa">
                <X size={18} />
              </button>
            </div>
            <iframe title="Vista previa del correo" sandbox="" srcDoc={vista.html} className="h-[50vh] w-full border-0 bg-canvas" />
            <div className="flex flex-wrap justify-end gap-2 border-t border-black/5 p-4">
              <button type="button" onClick={() => dialogRef.current?.close()} className={btn}>
                Cancelar
              </button>
              <button type="button" onClick={enviar} disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:opacity-60">
                <Send size={16} /> {pending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
