"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { trackBeginCheckout } from "@/lib/analytics";
import { SHIPPING_INFO } from "@/lib/pricing";
import PromoCodeField from "@/components/PromoCodeField";
import CartLines from "@/components/cart/CartLines";
import CartProgressBar from "@/components/cart/CartProgressBar";
import CartSuggestions from "@/components/cart/CartSuggestions";
import CartTotals from "@/components/cart/CartTotals";
import EmptyCart from "@/components/cart/EmptyCart";

export default function CarritoPage() {
  const { items, total, isHydrated, refresh, lastRemoved } = useCart();

  // Precios y existencias al día al abrir el carrito.
  useEffect(() => {
    if (isHydrated) refresh(true);
  }, [isHydrated, refresh]);

  if (!isHydrated) {
    // Un solo bloque más alto que la pantalla: al llegar el carrito, nada que ya se veía cambia de lugar
    // (dos bloques hacían que React reutilizara el segundo como resumen y lo moviera).
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Tu carrito</h1>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[100dvh] animate-pulse rounded-[28px] bg-white shadow-card lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14">
        {lastRemoved && (
          <div className="mb-4">
            <CartLines variant="full" />
          </div>
        )}
        <div className="rounded-[28px] bg-white shadow-card">
          <EmptyCart headingLevel="h1" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Tu carrito</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <CartLines variant="full" />
          <CartProgressBar />
        </div>

        <div className="h-fit space-y-4 rounded-[28px] bg-white p-6 shadow-card lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <h2 className="text-lg font-semibold tracking-tight">Resumen</h2>
          <PromoCodeField />
          <CartTotals />
          <Link
            href="/checkout"
            onClick={() => trackBeginCheckout(items, total)}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-accent text-center font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
          >
            Continuar al pago
          </Link>
          <p className="text-center text-xs text-muted">
            {SHIPPING_INFO} El costo final se confirma con tu dirección en el siguiente paso.
          </p>
        </div>

        <div className="lg:col-start-1">
          <CartSuggestions />
        </div>
      </div>
    </div>
  );
}
