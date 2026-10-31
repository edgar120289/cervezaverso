"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { reenviarCorreoPedido } from "@/app/actions/admin-pedidos";

/** Reenvía al cliente el correo del estado actual (por si no le llegó o cayó en no deseado). */
export default function ResendEmailButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function resend() {
    setMsg(null);
    startTransition(async () => {
      const result = await reenviarCorreoPedido(id);
      setMsg(result.ok ? "Correo reenviado." : result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={resend}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 bg-white px-5 text-sm font-semibold transition-colors hover:bg-canvas disabled:opacity-50"
      >
        <Mail size={16} /> {isPending ? "Enviando…" : "Reenviar correo al cliente"}
      </button>
      {msg && <p className="text-xs text-muted" role="status">{msg}</p>}
    </div>
  );
}
