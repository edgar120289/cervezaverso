import { feedId } from "@/lib/feed-id";
import type { CartItem, Product } from "@/lib/types";

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

/** Evento estándar InitiateCheckout del Meta Pixel al pasar del carrito al pago. */
export function trackInitiateCheckout(cartItems: CartItem[], totalPrice: number): void {
  if (typeof window === "undefined" || !window.fbq || cartItems.length === 0) return;
  window.fbq("track", "InitiateCheckout", {
    content_ids: cartItems.map(({ product }) => feedId(product.sku)),
    content_type: "product",
    value: totalPrice,
    currency: "MXN",
    num_items: cartItems.reduce((sum, { quantity }) => sum + quantity, 0),
  });
}

export type PurchaseOrder = {
  id: string;
  /** Total final cobrado (con descuento y envío). */
  total: number;
  items: { sku: string; cantidad: number }[];
};

/** Evento estándar Purchase del Meta Pixel; `eventID` es el id del pedido para deduplicar. */
export function trackPurchase(order: PurchaseOrder): boolean {
  if (typeof window === "undefined" || !window.fbq) return false;
  window.fbq(
    "track",
    "Purchase",
    {
      content_ids: order.items.map((item) => feedId(item.sku)),
      content_type: "product",
      value: order.total,
      currency: "MXN",
      num_items: order.items.reduce((sum, item) => sum + item.cantidad, 0),
    },
    { eventID: order.id },
  );
  return true;
}
