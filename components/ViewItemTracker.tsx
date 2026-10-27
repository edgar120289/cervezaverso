"use client";

import { useEffect } from "react";
import { gaViewItem } from "@/lib/google-tag";
import type { Product } from "@/lib/types";

/** Dispara `view_item` de GA4 al abrir la ficha de una cerveza. */
export default function ViewItemTracker({ product }: { product: Product }) {
  useEffect(() => {
    gaViewItem(product);
  }, [product]);

  return null;
}
