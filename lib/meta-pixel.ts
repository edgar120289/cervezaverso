import { feedId } from "@/lib/feed-id";
import type { Product } from "@/lib/types";

/** Evento estándar AddToCart del Meta Pixel; no hace nada si el pixel no cargó (sin consentimiento). */
export function trackAddToCart(product: Product): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "AddToCart", {
    content_ids: [feedId(product.sku)],
    content_type: "product",
    value: product.sale_price,
    currency: "MXN",
  });
}
