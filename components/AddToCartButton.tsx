"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const isOutOfStock = product.stock_status === "out_of_stock";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      disabled={isOutOfStock}
      onClick={() => {
        addItem(product);
        openDrawer();
      }}
      className="w-full rounded-full bg-[#5433eb] px-7 py-3.5 font-semibold text-white shadow-accent transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40 disabled:shadow-none sm:w-auto"
    >
      {isOutOfStock ? "Agotada" : "Agregar al carrito"}
    </motion.button>
  );
}
