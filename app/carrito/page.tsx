"use client";

import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trackBeginCheckout } from "@/lib/analytics";
import { formatMXN, FREE_SHIPPING_THRESHOLD_METRO, SHIPPING_INFO } from "@/lib/pricing";
import BottleFallback from "@/components/BottleFallback";
import { VolumeDiscountNotice, VolumeDiscountRow } from "@/components/VolumeDiscount";
import PromoCodeField, { DiscountRow } from "@/components/PromoCodeField";
import { normalCase } from "@/lib/text-case";

export default function CarritoPage() {
  const { items, setQuantity, removeItem, subtotal, promo, discount, volumeDiscount, shippingCost, total } = useCart();
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_METRO - subtotal);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-5xl">🍻</span>
        <h1 className="text-2xl font-semibold tracking-tight">Tu carrito está vacío</h1>
        <p className="text-muted">
          Elige tu primera cerveza del catálogo para empezar.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-accent"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Tu carrito</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-[28px] bg-white p-4 shadow-card"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-white">
                {product.image_url ? (
                  <ProductImage
                    src={product.image_url}
                    alt={normalCase(product.name)}
                    sizes="96px"
                    thumb
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-black/20">
                    <BottleFallback className="h-16 w-16" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{normalCase(product.name)}</p>
                    <p className="text-xs text-muted">
                      {normalCase(product.style)} · {normalCase(product.country)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label={`Quitar ${normalCase(product.name)}`}
                    className="text-muted hover:text-black/60"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-full bg-canvas px-3 py-1.5">
                    <button
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatMXN(product.sale_price * quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-4 rounded-[28px] bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight">Resumen</h2>

          {remainingForFreeShipping > 0 ? (
            <p className="rounded-[20px] bg-canvas px-4 py-3 text-xs text-black/60">
              Te faltan {formatMXN(remainingForFreeShipping)} para el envío gratis. Si tu dirección está fuera de CDMX y
              zona metropolitana, es gratis desde $3,000.
            </p>
          ) : (
            <p className="rounded-[20px] bg-canvas px-4 py-3 text-xs font-semibold text-black/70">
              ¡Envío gratis desbloqueado en CDMX y zona metropolitana!
            </p>
          )}

          <PromoCodeField />
          <VolumeDiscountNotice />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-black/60">
              <span>Subtotal</span>
              <span>{formatMXN(subtotal)}</span>
            </div>
            {promo && <DiscountRow code={promo.code} amount={discount} />}
            <VolumeDiscountRow amount={volumeDiscount} />
            <div className="flex justify-between text-black/60">
              <span>Envío (CDMX y zona metropolitana)</span>
              <span>{shippingCost === 0 ? "Gratis" : formatMXN(shippingCost)}</span>
            </div>
            <div className="flex justify-between pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatMXN(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            onClick={() => trackBeginCheckout(items, total)}
            className="block w-full rounded-full bg-accent py-3.5 text-center font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
          >
            Continuar al pago
          </Link>
          <p className="text-center text-[11px] text-muted">
            {SHIPPING_INFO} El costo final se confirma con tu dirección en el siguiente paso.
          </p>
        </div>
      </div>
    </div>
  );
}
