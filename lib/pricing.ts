import type { AppliedPromo, StockStatus } from "@/lib/types";
import type { ShippingZone } from "@/lib/shipping-zones";

/** Envío gratis desde este subtotal en el resto del país. */
const FREE_SHIPPING_THRESHOLD = 3000;
/** Envío gratis desde este subtotal en CDMX y zona metropolitana. */
const FREE_SHIPPING_THRESHOLD_METRO = 1000;
/** Descuento por volumen: aplica en compras con subtotal de productos MAYOR a este monto. */
const VOLUME_DISCOUNT_THRESHOLD = 6000;
const VOLUME_DISCOUNT_PCT = 10;
/** Desde este subtotal el carrito avisa cuánto falta para el descuento por volumen. */
const VOLUME_DISCOUNT_HINT_FROM = 5000;

/** Tarifa base temporal: se sustituirá por la cotización de la paquetería. */
const FLAT_SHIPPING_COST = 150;

export function freeShippingThreshold(zone: ShippingZone): number {
  return zone === "metro" ? FREE_SHIPPING_THRESHOLD_METRO : FREE_SHIPPING_THRESHOLD;
}

export const DEFAULT_MARGIN_PCT = 35;
/** Tope del margen real: con 100% el divisor sería cero. */
export const MAX_MARGIN_PCT = 95;

/**
 * Regla de precio de venta obligatoria (SPEC.md #6.3):
 * margen de utilidad real sobre el precio de venta (35% por defecto): costo / (1 - margen),
 * redondeado hacia abajo al múltiplo de 5.
 */
export function calculateSalePrice(costPrice: number, marginPct: number = DEFAULT_MARGIN_PCT): number {
  const raw = costPrice / (1 - marginPct / 100);
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
    delivery: "Entrega en 24 a 48 horas en CDMX y zona metropolitana, y en 3 a 6 días hábiles en el resto del país.",
  },
  transferencia: {
    label: "Transferencia Interbancaria (Sin comisiones)",
    description: "Pagas desde tu banca en línea y nos envías el comprobante.",
    delivery: "Procesamiento prioritario (reduce el tiempo estándar de entrega).",
  },
};

/** Texto informativo único de tiempos de entrega. */
export const SHIPPING_INFO =
  "Entrega en 24 a 48 horas en CDMX y zona metropolitana, y en 3 a 6 días hábiles por paquetería en el resto del país. (El tiempo de procesamiento y envío se reduce si el pago es mediante transferencia bancaria)";

/** Regla de costo por zona, para mostrarla en fichas, carrito, /envios y Términos. */
export const SHIPPING_RULE_TEXT =
  "Envío gratis en CDMX y zona metropolitana desde $1,000 (24 a 48 h). Resto del país: gratis desde $3,000 (3 a 6 días hábiles). Paga con tarjeta, SPEI u OXXO.";

/** `local` ya no se ofrece: se conserva solo para mostrar pedidos anteriores. */
export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; description: string }
> = {
  nacional: {
    label: "Envío nacional por paquetería",
    description: `${SHIPPING_INFO} Gratis desde ${formatMXN(FREE_SHIPPING_THRESHOLD_METRO)} en CDMX y zona metropolitana, y desde ${formatMXN(FREE_SHIPPING_THRESHOLD)} en el resto del país.`,
  },
  local: {
    label: "Envío local (anterior)",
    description: "Método retirado.",
  },
};

/**
 * Tarifa base de $150; gratis desde $1,000 de subtotal en CDMX y zona metropolitana
 * y desde $3,000 en el resto del país.
 */
export function calculateShippingCost(subtotal: number, zone: ShippingZone): number {
  return subtotal >= freeShippingThreshold(zone) ? 0 : FLAT_SHIPPING_COST;
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

/**
 * Descuento por volumen sobre el subtotal de productos (nunca sobre el envío). No es acumulable:
 * si un código ya descuenta algo (`promoDiscount > 0`), no se aplica.
 */
export function calculateVolumeDiscount(subtotal: number, promoDiscount: number): number {
  if (promoDiscount > 0 || subtotal <= VOLUME_DISCOUNT_THRESHOLD) return 0;
  return Math.floor((subtotal * VOLUME_DISCOUNT_PCT) / 100);
}

export type OrderTotals = {
  subtotal: number;
  discount: number;
  volumeDiscount: number;
  shippingCost: number;
  total: number;
};

/**
 * Totales del pedido. El envío gratis se mide con el subtotal ANTES del
 * descuento: si se midiera después, un cupón podría quitar el envío gratis y
 * subir el total (p. ej. $2,100 − 10% = $1,890 + $490 de envío = $2,380).
 * Así, usar un código nunca cuesta más que no usarlo.
 */
export function calculateOrderTotals(
  subtotal: number,
  promo: AppliedPromo | null,
  zone: ShippingZone
): OrderTotals {
  const discount = calculateDiscount(subtotal, promo);
  const volumeDiscount = calculateVolumeDiscount(subtotal, discount);
  const shippingCost = subtotal > 0 ? calculateShippingCost(subtotal, zone) : 0;
  return { subtotal, discount, volumeDiscount, shippingCost, total: subtotal - discount - volumeDiscount + shippingCost };
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

export { VOLUME_DISCOUNT_THRESHOLD, VOLUME_DISCOUNT_PCT, VOLUME_DISCOUNT_HINT_FROM, FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_METRO, FLAT_SHIPPING_COST };
