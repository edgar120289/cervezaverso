"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMXN, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { DiscountRow } from "./PromoCodeField";
import BottleFallback from "./BottleFallback";

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    setQuantity,
    removeItem,
    subtotal,
    promo,
    discount,
    shippingCost,
    total,
  } = useCart();

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col bg-canvas p-4"
          >
            <div className="flex items-center justify-between rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="text-lg font-semibold tracking-tight">Tu carrito</h2>
              <button
                onClick={closeDrawer}
                aria-label="Cerrar carrito"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="text-4xl">🍻</span>
                <p className="text-lg font-semibold tracking-tight">Tu carrito está vacío</p>
                <p className="text-sm text-muted">
                  Elige tu primera cerveza del catálogo para empezar.
                </p>
                <button
                  onClick={closeDrawer}
                  className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-accent"
                >
                  Explorar cervezas
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 flex-1 space-y-3 overflow-y-auto scrollbar-none pb-4">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-3 rounded-[20px] bg-white p-3 shadow-card"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[20px] bg-canvas">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-black/20">
                            <BottleFallback className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{product.name}</p>
                          <button
                            onClick={() => removeItem(product.id)}
                            aria-label={`Quitar ${product.name}`}
                            className="text-muted hover:text-black/60"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full bg-canvas px-2 py-1">
                            <button
                              onClick={() => setQuantity(product.id, quantity - 1)}
                              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center text-xs font-semibold">{quantity}</span>
                            <button
                              onClick={() => setQuantity(product.id, quantity + 1)}
                              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatMXN(product.sale_price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-[28px] bg-white p-5 shadow-card">
                  {remainingForFreeShipping > 0 ? (
                    <p className="text-xs text-muted">
                      Agrega {formatMXN(remainingForFreeShipping)} más y obtén envío gratis.
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-black/60">
                      ¡Envío gratis desbloqueado!
                    </p>
                  )}

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-black/60">
                      <span>Subtotal</span>
                      <span>{formatMXN(subtotal)}</span>
                    </div>
                    {promo && <DiscountRow code={promo.code} amount={discount} />}
                    <div className="flex justify-between text-black/60">
                      <span>Envío nacional</span>
                      <span>{shippingCost === 0 ? "Gratis" : formatMXN(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 text-base font-semibold">
                      <span>Total</span>
                      <span>{formatMXN(total)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="block rounded-full bg-accent py-3.5 text-center font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
                  >
                    Ir a pagar
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
