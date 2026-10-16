"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";
import { BANK_TRANSFER } from "@/lib/site";

function formatClabe(clabe: string): string {
  return clabe.replace(/(\d{3})(\d{3})(\d{11})(\d)/, "$1 $2 $3 $4");
}

/** Datos para pagar por transferencia interbancaria, con botón para copiar la CLABE. */
export default function BankTransferCard() {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  async function copyClabe() {
    try {
      await navigator.clipboard.writeText(BANK_TRANSFER.clabe);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2000);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[28px] bg-ink text-white shadow-card">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-white/10">
          <Landmark size={20} aria-hidden />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">Datos para transferencia</h3>
      </div>
      <dl className="space-y-4 px-6 py-5 text-sm">
        <div>
          <dt className="text-white/60">Beneficiario</dt>
          <dd className="mt-0.5 text-base font-semibold">{BANK_TRANSFER.beneficiario}</dd>
        </div>
        <div>
          <dt className="text-white/60">Banco</dt>
          <dd className="mt-0.5 text-base font-semibold">{BANK_TRANSFER.banco}</dd>
        </div>
        <div>
          <dt className="text-white/60">CLABE</dt>
          <dd className="mt-0.5 break-all font-mono text-xl font-semibold tracking-wider tabular-nums">
            {formatClabe(BANK_TRANSFER.clabe)}
          </dd>
        </div>
      </dl>
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={copyClabe}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          {copied ? "¡Copiado!" : "Copiar CLABE"}
        </button>
        <p role="status" className="sr-only">
          {copied ? "CLABE copiada al portapapeles" : copyFailed ? "No se pudo copiar la CLABE" : ""}
        </p>
        {copyFailed && <p className="mt-2 text-center text-xs text-white/70">No pudimos copiarla; selecciónala manualmente.</p>}
        <p className="mt-3 text-center text-xs text-white/60">
          Al terminar tu pedido te pediremos enviar el comprobante por WhatsApp para confirmar tu pago.
        </p>
      </div>
    </div>
  );
}
