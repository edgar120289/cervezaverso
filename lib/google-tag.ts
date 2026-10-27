import { feedId } from "@/lib/feed-id";
import type { CartItem, Product } from "@/lib/types";

const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const RAW_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const RAW_ADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;

/** Los IDs se insertan en un script en línea: solo se aceptan con el formato esperado. */
export const GA_ID = RAW_GA_ID && /^G-[A-Z0-9]+$/.test(RAW_GA_ID) ? RAW_GA_ID : undefined;
export const ADS_ID = RAW_ADS_ID && /^AW-\d+$/.test(RAW_ADS_ID) ? RAW_ADS_ID : undefined;
const ADS_PURCHASE_LABEL = RAW_ADS_LABEL && /^[\w-]+$/.test(RAW_ADS_LABEL) ? RAW_ADS_LABEL : undefined;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GtagItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity: number;
};

function toItem(product: Product, quantity: number): GtagItem {
  return {
    item_id: feedId(product.sku),
    item_name: product.name,
    item_brand: product.brewery || undefined,
    item_category: product.style || undefined,
    price: product.sale_price,
    quantity,
  };
}

/** Con el Modo de consentimiento, `gtag` existe siempre; si Google está denegado envía pings sin cookies. */
function send(event: string, params: Record<string, unknown>): boolean {
  if (typeof window === "undefined" || !window.gtag) return false;
  window.gtag("event", event, params);
  return true;
}

export function gaViewItem(product: Product): void {
  send("view_item", {
    currency: "MXN",
    value: product.sale_price,
    items: [toItem(product, 1)],
  });
}

export function gaAddToCart(product: Product): void {
  send("add_to_cart", {
    currency: "MXN",
    value: product.sale_price,
    items: [toItem(product, 1)],
  });
}

export function gaBeginCheckout(cartItems: CartItem[], totalPrice: number): void {
  if (cartItems.length === 0) return;
  send("begin_checkout", {
    currency: "MXN",
    value: totalPrice,
    items: cartItems.map(({ product, quantity }) => toItem(product, quantity)),
  });
}

export type GooglePurchase = {
  /** Id del pedido: es el `transaction_id` con el que Google deduplica. */
  id: string;
  /** Total final cobrado (con descuentos y envío). */
  total: number;
  shipping: number;
  items: { sku: string; nombre: string; precio: number; cantidad: number }[];
};

/**
 * `purchase` de GA4 y conversión «Compra» de Google Ads. Devuelve `false` si la etiqueta aún no
 * está disponible, para que el llamador reintente.
 */
export function gaPurchase(order: GooglePurchase): boolean {
  const sent = send("purchase", {
    transaction_id: order.id,
    currency: "MXN",
    value: order.total,
    shipping: order.shipping,
    items: order.items.map((item) => ({
      item_id: feedId(item.sku),
      item_name: item.nombre,
      price: item.precio,
      quantity: item.cantidad,
    })),
  });
  if (sent && ADS_ID && ADS_PURCHASE_LABEL) {
    send("conversion", {
      send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`,
      value: order.total,
      currency: "MXN",
      transaction_id: order.id,
    });
  }
  return sent;
}
