import type { AppliedPromo, StockStatus } from "@/lib/types";

const FREE_SHIPPING_THRESHOLD = 3000;
/** Tarifa base temporal: se sustituirá por la cotización de la paquetería. */
const FLAT_SHIPPING_COST = 150;

export const DEFAULT_MARGIN_PCT = 50;

/**
 * Regla de precio de venta obligatoria (SPEC.md #6.3):
 * costo + margen (50% por defecto) redondeado hacia abajo al múltiplo de 5.
 */
export function calculateSalePrice(costPrice: number, marginPct: number = DEFAULT_MARGIN_PCT): number {
  const raw = (costPrice * (100 + marginPct)) / 100;
  // El épsilon evita que errores de coma flotante (114.99999…) bajen un múltiplo de 5.
  return Math.floor((raw + 1e-9) / 5) * 5;
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "Disponible",
  low_stock: "Pocas piezas",
  out_of_stock: "Agotada",
  preorder: "Preventa",
};

export type ShippingMethod = "nacional" | "local";

export type PaymentMethod = "mercadopago" | "transferencia";

export const PAYMENT_METHODS: Record<
  PaymentMethod,
  { label: string; description: string; delivery: string }
> = {
  mercadopago: {
    label: "Mercado Pago",
    description: "Tarjetas, SPEI y efectivo.",
    delivery: "Tiempo estimado de entrega: 3 a 6 días hábiles",
  },
  transferencia: {
    label: "Transferencia Interbancaria (Sin comisiones)",
    description: "Pagas desde tu banca en línea y nos envías el comprobante.",
    delivery: "Entrega rápida: 24 a 48 horas hábiles",
  },
};

/** Texto informativo único de envíos y tiempos de entrega. */
export const SHIPPING_INFO =
  "Envío a toda la República Mexicana con tiempo de entrega de 3 a 6 días hábiles. (El tiempo de procesamiento y envío se reduce si el pago es mediante transferencia bancaria)";

/** `local` ya no se ofrece: se conserva solo para mostrar pedidos anteriores. */
export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; description: string }
> = {
  nacional: {
    label: "Envío nacional por paquetería",
    description: `${SHIPPING_INFO} Gratis en compras desde ${formatMXN(FREE_SHIPPING_THRESHOLD)}.`,
  },
  local: {
    label: "Envío local (anterior)",
    description: "Método retirado.",
  },
};

/**
 * Envío nacional: tarifa base de $150, gratis desde $3,000 de subtotal.
 */
export function calculateShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
}

/**
 * Descuento de un código sobre el subtotal de productos (en pesos enteros).
 * 0 si no alcanza la compra mínima. Un monto fijo nunca excede el subtotal.
 */
function calculateDiscount(subtotal: number, promo: AppliedPromo | null): number {
  if (!promo || subtotal <= 0 || subtotal < promo.min_purchase) return 0;
  const raw = promo.discount_type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
  return Math.min(Math.floor(raw), subtotal);
}

export type OrderTotals = { subtotal: number; discount: number; shippingCost: number; total: number };

/**
 * Totales del pedido. El envío gratis se mide con el subtotal ANTES del
 * descuento: si se midiera después, un cupón podría quitar el envío gratis y
 * subir el total (p. ej. $2,100 − 10% = $1,890 + $490 de envío = $2,380).
 * Así, usar un código nunca cuesta más que no usarlo.
 */
export function calculateOrderTotals(
  subtotal: number,
  promo: AppliedPromo | null
): OrderTotals {
  const discount = calculateDiscount(subtotal, promo);
  const shippingCost = subtotal > 0 ? calculateShippingCost(subtotal) : 0;
  return { subtotal, discount, shippingCost, total: subtotal - discount + shippingCost };
}

/** "10%" o "$500" */
export function formatPromoValue(promo: Pick<AppliedPromo, "discount_type" | "value">): string {
  return promo.discount_type === "percent" ? `${promo.value}%` : formatMXN(promo.value);
}

export function formatMXN(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

export { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_COST };
