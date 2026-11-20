"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "@/lib/validation";

/** Selector − / + con objetivos táctiles de 44 px. En 1, «−» quita el renglón (con «Deshacer»). */
export default function QuantityStepper({
  quantity,
  name,
  onChange,
  disableIncrease = false,
}: {
  quantity: number;
  name: string;
  onChange: (quantity: number) => void;
  /** Agotada: se puede bajar o quitar, no subir. */
  disableIncrease?: boolean;
}) {
  const atMax = quantity >= MAX_LINE_QUANTITY;
  return (
    <div className="flex h-11 shrink-0 items-center rounded-full bg-canvas">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={quantity <= 1 ? `Quitar ${name}` : `Quitar una pieza de ${name}`}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5 active:scale-95"
      >
        <Minus size={16} aria-hidden />
      </button>
      <span aria-live="polite" aria-label={`${quantity} piezas`} className="w-7 text-center text-base font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={atMax || disableIncrease}
        aria-label={atMax ? `Máximo ${MAX_LINE_QUANTITY} piezas por cerveza` : `Agregar una pieza de ${name}`}
        title={atMax ? `Máximo ${MAX_LINE_QUANTITY} piezas por cerveza` : undefined}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}
