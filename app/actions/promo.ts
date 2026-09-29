"use server";

import { findActivePromo } from "@/lib/promo";
import { firstIssue, promoCodeSchema } from "@/lib/validation";
import type { AppliedPromo } from "@/lib/types";

export type PromoResult = { ok: true; promo: AppliedPromo } | { ok: false; error: string };

/** Valida un código desde el carrito o el checkout. El cobro lo vuelve a validar `crearPedido`. */
export async function validarCodigoPromo(code: string): Promise<PromoResult> {
  const parsed = promoCodeSchema.safeParse(code);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const result = await findActivePromo(parsed.data);
  if (!result.ok) return result;
  // Sin el id interno: el navegador sólo necesita lo necesario para mostrar el descuento.
  const { code: promoCode, discount_type, value, min_purchase } = result.promo;
  return { ok: true, promo: { code: promoCode, discount_type, value, min_purchase } };
}
