"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Vacía el carrito al volver del pago: el pedido ya quedó registrado. */
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
