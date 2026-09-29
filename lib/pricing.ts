import type { AppliedPromo, StockStatus } from "@/lib/types";

const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_COST = 490;

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

/** Estados cubiertos por el envío local (CDMX y Área Metropolitana). */
export const LOCAL_SHIPPING_STATES = ["Ciudad de México", "Estado de México"] as const;

export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; description: string }
> = {
  nacional: {
    label: "Envío nacional por paquetería",
    description: `A toda la República. Gratis en compras desde ${formatMXN(FREE_SHIPPING_THRESHOLD)}.`,
  },
  local: {
    label: "Envío local CDMX y Área Metropolitana",
    description: "Sin costo · Entrega en 2 a 3 días hábiles.",
  },
};

/**
 * Nacional: tarifa fija de $490, gratis desde $2,000 de subtotal.
 * Local (CDMX y Área Metropolitana): siempre $0.
 */
export function calculateShippingCost(subtotal: number, method: ShippingMethod = "nacional"): number {
  if (method === "local") return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
}

/**
 * Descuento de un código sobre el subtotal de productos (en pesos enteros).
 * 0 si no alcanza la compra mínima. Un monto fijo nunca excede el subtotal.
 */
export function calculateDiscount(subtotal: number, promo: AppliedPromo | null): number {
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
  method: ShippingMethod,
  promo: AppliedPromo | null
): OrderTotals {
  const discount = calculateDiscount(subtotal, promo);
  const shippingCost = subtotal > 0 ? calculateShippingCost(subtotal, method) : 0;
  return { subtotal, discount, shippingCost, total: subtotal - discount + shippingCost };
}

/** "10%" o "$500" */
export function formatPromoValue(promo: Pick<AppliedPromo, "discount_type" | "value">): string {
  return promo.discount_type === "percent" ? `${promo.value}%` : formatMXN(promo.value);
}

export function isLocalShippingState(estado: string): boolean {
  return (LOCAL_SHIPPING_STATES as readonly string[]).includes(estado);
}

export function formatMXN(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

export { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_COST };
