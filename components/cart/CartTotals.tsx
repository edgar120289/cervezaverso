"use client";

import { useCart } from "@/lib/cart-context";
import { formatMXN } from "@/lib/pricing";
import { DiscountRow } from "@/components/PromoCodeField";
import { VolumeDiscountNotice, VolumeDiscountRow } from "@/components/VolumeDiscount";

/** Subtotal, descuentos, envío y total del carrito (página y cajón). */
export default function CartTotals() {
  const { subtotal, promo, discount, volumeDiscount, shippingCost, total } = useCart();
  return (
    <div className="space-y-3">
      {/* Solo el caso del código que impide el 10 %; «cuánto falta» ya lo dice la barra. */}
      {discount > 0 && <VolumeDiscountNotice />}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-black/60">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatMXN(subtotal)}</span>
        </div>
        {promo && <DiscountRow code={promo.code} amount={discount} />}
        <VolumeDiscountRow amount={volumeDiscount} />
        <div className="flex justify-between gap-3 text-black/60">
          <span>Envío</span>
          <span className="text-right tabular-nums">
            {shippingCost === null ? "Se calcula con tu código postal" : shippingCost === 0 ? "Gratis" : formatMXN(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between pt-1.5 text-base font-semibold">
          <span>{shippingCost === null ? "Total sin envío" : "Total"}</span>
          <span className="tabular-nums">{formatMXN(total)}</span>
        </div>
      </div>
    </div>
  );
}
