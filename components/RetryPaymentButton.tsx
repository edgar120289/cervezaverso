"use client";

import { useState, useTransition } from "react";
import { reintentarPago } from "@/app/actions/pago";

export default function RetryPaymentButton({ pedidoId }: { pedidoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function retry() {
    setError(null);
    startTransition(async () => {
      const result = await reintentarPago(pedidoId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.initPoint);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={retry}
        disabled={isPending}
        className="min-h-12 rounded-full bg-accent px-8 py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "Preparando tu pago…" : "Reintentar pago"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
