"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trackBeginCheckout } from "@/lib/analytics";
import CartLines from "./cart/CartLines";
import CartProgressBar from "./cart/CartProgressBar";
import CartSuggestions from "./cart/CartSuggestions";
import CartTotals from "./cart/CartTotals";
import EmptyCart from "./cart/EmptyCart";

export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, total, refresh, lastRemoved } = useCart();

  useEffect(() => {
    if (isDrawerOpen) refresh();
  }, [isDrawerOpen, refresh]);

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
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center">
                {lastRemoved && (
                  <div className="mb-3">
                    <CartLines variant="full" onNavigate={closeDrawer} />
                  </div>
                )}
                <EmptyCart onNavigate={closeDrawer} />
              </div>
            ) : (
              <>
                <div className="mt-4 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-4 scrollbar-none">
                  <CartLines variant="full" onNavigate={closeDrawer} />
                  <CartProgressBar />
                  <CartSuggestions onNavigate={closeDrawer} />
                </div>

                <div className="space-y-3 rounded-[28px] bg-white p-5 shadow-card">
                  <CartTotals />
                  <Link
                    href="/checkout"
                    onClick={() => {
                      trackBeginCheckout(items, total);
                      closeDrawer();
                    }}
                    className="flex min-h-12 items-center justify-center rounded-full bg-accent text-center font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
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
