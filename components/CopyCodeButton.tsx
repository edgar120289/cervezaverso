"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia tu código:", code);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Código copiado" : `Copiar código ${code}`}
      className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-canvas px-4 text-xs font-semibold transition-transform hover:bg-black hover:text-white active:scale-[0.98]"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
