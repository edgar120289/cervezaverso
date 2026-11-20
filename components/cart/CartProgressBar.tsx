"use client";

import { useCart } from "@/lib/cart-context";
import { cartProgress } from "@/lib/cart-progress";

/** Una barra: primero el envío gratis (según el CP, o las dos zonas sin CP) y luego el 10 % por volumen. */
export default function CartProgressBar() {
  const { subtotal, shippingZone } = useCart();
  const progress = cartProgress(subtotal, shippingZone);

  return (
    <div className="rounded-[20px] bg-canvas px-4 py-3">
      <p className="text-sm font-semibold text-black/80">{progress.message}</p>
      {progress.detail && <p className="mt-0.5 text-xs text-muted">{progress.detail}</p>}
      <div
        role="progressbar"
        aria-label={progress.message}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="mt-2 h-2 overflow-hidden rounded-full bg-black/10"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
