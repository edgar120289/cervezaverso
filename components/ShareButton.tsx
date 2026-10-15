"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // El usuario cerró el menú nativo: no es un error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={share}
        aria-label={`Compartir ${title}`}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-pill border border-black/10 bg-surface text-muted transition-[transform,colors] hover:border-black/20 hover:text-black/70 active:scale-90"
      >
        {copied ? <Check size={20} strokeWidth={2.25} /> : <Share2 size={20} strokeWidth={2.25} />}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        {copied ? "Enlace copiado al portapapeles" : ""}
      </span>
    </span>
  );
}
