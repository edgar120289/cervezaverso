"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Gift, Loader2, TicketPercent, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMXN, formatPromoValue } from "@/lib/pricing";

/**
 * "¿Tienes un código o tarjeta de regalo?". No es un <form> anidado: en el
 * checkout vive dentro del formulario del pedido, así que Enter se intercepta.
 */
export default function PromoCodeField() {
  const { promo, applyPromo, removePromo, discount, subtotal } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      const message = await applyPromo(code);
      if (message) setError(message);
      else {
        setCode("");
        setIsOpen(false);
      }
    });
  }

  if (promo) {
    const faltante = Math.max(0, promo.min_purchase - subtotal);
    const Icon = promo.discount_type === "fixed" ? Gift : TicketPercent;
    return (
      <div className="rounded-[20px] border border-accent/25 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon size={18} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold tracking-wide">{promo.code}</p>
            <p className="text-xs text-black/55">
              {promo.discount_type === "fixed" ? "Tarjeta de regalo" : "Descuento"} de {formatPromoValue(promo)}
              {discount > 0 && ` · ahorras ${formatMXN(discount)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={removePromo}
            aria-label={`Quitar el código ${promo.code}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black"
          >
            <X size={16} />
          </button>
        </div>
        {faltante > 0 && (
          <p className="mt-2 text-xs text-black/60">
            Este código aplica en compras desde {formatMXN(promo.min_purchase)}. Agrega {formatMXN(faltante)} más
            para usarlo.
          </p>
        )}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-2 rounded-[20px] border border-dashed border-black/15 px-4 py-3 text-left text-sm font-semibold text-black/60 transition-colors hover:border-accent/40 hover:text-black"
      >
        <Gift size={16} className="shrink-0" />
        ¿Tienes un código o tarjeta de regalo?
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="promo-code" className="block px-1 text-sm font-semibold">
        ¿Tienes un código o tarjeta de regalo?
      </label>
      <div className="flex gap-2">
        <input
          id="promo-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ej. REGALO500"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          maxLength={30}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-code-error" : undefined}
          className="min-w-0 flex-1 rounded-full bg-[#f2f4f5] px-4 py-3 text-sm font-semibold uppercase tracking-wide outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-black/35 focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={isPending || !code.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Aplicar
        </button>
      </div>
      {error && (
        <p id="promo-code-error" role="alert" className="px-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Renglón "Descuento" de los resúmenes (carrito, cajón y checkout). */
export function DiscountRow({ code, amount }: { code: string; amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="flex justify-between font-semibold text-accent">
      <span>Descuento ({code})</span>
      <span className="tabular-nums">−{formatMXN(amount)}</span>
    </div>
  );
}
