import {
  formatMXN,
  FREE_SHIPPING_THRESHOLD,
  FREE_SHIPPING_THRESHOLD_METRO,
  VOLUME_DISCOUNT_PCT,
  VOLUME_DISCOUNT_THRESHOLD,
} from "@/lib/pricing";
import type { ShippingZone } from "@/lib/shipping-zones";

/** Una sola meta a la vez: primero el envío gratis y, alcanzado, el descuento por volumen. */
export type CartProgress = {
  /** Texto principal («Te faltan $X para…» o la meta cumplida). */
  message: string;
  /** Aclaración breve opcional (la otra zona cuando aún no hay CP). */
  detail: string | null;
  /** Monto que se busca alcanzar; null cuando ya no hay meta pendiente. */
  target: number | null;
  percent: number;
};

const percentOf = (subtotal: number, target: number) => Math.min(100, Math.max(0, Math.round((subtotal / target) * 100)));

/**
 * Meta siguiente según las reglas reales de `lib/pricing.ts` (nunca cifras escritas a mano):
 * envío gratis desde $1,000 en CDMX y zona metropolitana y desde $3,000 en el resto del país;
 * después, 10 % en compras MAYORES a $6,000. Sin CP se muestran las dos zonas de forma breve.
 */
export function cartProgress(subtotal: number, zone: ShippingZone | null): CartProgress {
  const volume = (prefix: string): CartProgress => {
    if (subtotal > VOLUME_DISCOUNT_THRESHOLD) {
      return {
        message: `${prefix}Ya tienes el ${VOLUME_DISCOUNT_PCT} % de descuento por volumen.`,
        detail: null,
        target: null,
        percent: 100,
      };
    }
    const missing = VOLUME_DISCOUNT_THRESHOLD - subtotal;
    return {
      message:
        missing === 0
          ? `${prefix}Agrega una cerveza más para el ${VOLUME_DISCOUNT_PCT} % en compras mayores a ${formatMXN(VOLUME_DISCOUNT_THRESHOLD)}.`
          : `${prefix}Te faltan ${formatMXN(missing)} para el ${VOLUME_DISCOUNT_PCT} % en compras mayores a ${formatMXN(VOLUME_DISCOUNT_THRESHOLD)}.`,
      detail: null,
      target: VOLUME_DISCOUNT_THRESHOLD,
      percent: percentOf(subtotal, VOLUME_DISCOUNT_THRESHOLD),
    };
  };

  if (zone) {
    const threshold = zone === "metro" ? FREE_SHIPPING_THRESHOLD_METRO : FREE_SHIPPING_THRESHOLD;
    if (subtotal < threshold) {
      return {
        message: `Te faltan ${formatMXN(threshold - subtotal)} para el envío gratis.`,
        detail: zone === "metro" ? "CDMX y zona metropolitana" : "Resto del país",
        target: threshold,
        percent: percentOf(subtotal, threshold),
      };
    }
    return volume("Envío gratis. ");
  }

  if (subtotal < FREE_SHIPPING_THRESHOLD_METRO) {
    return {
      message: `Te faltan ${formatMXN(FREE_SHIPPING_THRESHOLD_METRO - subtotal)} para el envío gratis en CDMX y zona metropolitana.`,
      detail: `Resto del país: gratis desde ${formatMXN(FREE_SHIPPING_THRESHOLD)}.`,
      target: FREE_SHIPPING_THRESHOLD_METRO,
      percent: percentOf(subtotal, FREE_SHIPPING_THRESHOLD_METRO),
    };
  }
  if (subtotal < FREE_SHIPPING_THRESHOLD) {
    return {
      message: `Te faltan ${formatMXN(FREE_SHIPPING_THRESHOLD - subtotal)} para el envío gratis al resto del país.`,
      detail: "En CDMX y zona metropolitana ya es gratis.",
      target: FREE_SHIPPING_THRESHOLD,
      percent: percentOf(subtotal, FREE_SHIPPING_THRESHOLD),
    };
  }
  return volume("Envío gratis. ");
}

/** Una sola línea para el checkout (sin barra): solo el envío gratis. */
export function shippingHint(subtotal: number, zone: ShippingZone | null): string {
  if (zone) {
    const threshold = zone === "metro" ? FREE_SHIPPING_THRESHOLD_METRO : FREE_SHIPPING_THRESHOLD;
    return subtotal >= threshold
      ? "Tu envío es gratis."
      : `Te faltan ${formatMXN(threshold - subtotal)} para el envío gratis.`;
  }
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return "Tu envío es gratis.";
  if (subtotal >= FREE_SHIPPING_THRESHOLD_METRO) {
    return `Envío gratis en CDMX y zona metropolitana; al resto del país te faltan ${formatMXN(FREE_SHIPPING_THRESHOLD - subtotal)}.`;
  }
  return `Envío gratis desde ${formatMXN(FREE_SHIPPING_THRESHOLD_METRO)} en CDMX y zona metropolitana y desde ${formatMXN(FREE_SHIPPING_THRESHOLD)} en el resto del país.`;
}
