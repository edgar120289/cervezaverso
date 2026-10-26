"use client";

import { useCart } from "@/lib/cart-context";
import { formatMXN, VOLUME_DISCOUNT_HINT_FROM, VOLUME_DISCOUNT_PCT, VOLUME_DISCOUNT_THRESHOLD } from "@/lib/pricing";

/** Renglón «Descuento por volumen» de los resúmenes (carrito, cajón y checkout). */
export function VolumeDiscountRow({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="flex justify-between font-semibold text-accent">
      <span>Descuento por volumen ({VOLUME_DISCOUNT_PCT}%)</span>
      <span className="tabular-nums">−{formatMXN(amount)}</span>
    </div>
  );
}

/** Aviso del descuento por volumen: cuánto falta, o por qué no se aplica con un código. */
export function VolumeDiscountNotice({ className = "" }: { className?: string }) {
  const { subtotal, discount } = useCart();

  if (discount > 0 && subtotal > VOLUME_DISCOUNT_THRESHOLD) {
    return (
      <p className={`rounded-[20px] bg-canvas px-4 py-3 text-xs text-black/60 ${className}`}>
        El {VOLUME_DISCOUNT_PCT}% por volumen no se acumula con códigos ni cupones. Quita el código para aplicar el{" "}
        {VOLUME_DISCOUNT_PCT}%.
      </p>
    );
  }

  if (discount === 0 && subtotal >= VOLUME_DISCOUNT_HINT_FROM && subtotal <= VOLUME_DISCOUNT_THRESHOLD) {
    return (
      <p className={`rounded-[20px] bg-canvas px-4 py-3 text-xs text-black/60 ${className}`}>
        Te faltan {formatMXN(VOLUME_DISCOUNT_THRESHOLD + 1 - subtotal)} para el {VOLUME_DISCOUNT_PCT}% de descuento.
      </p>
    );
  }

  return null;
}
