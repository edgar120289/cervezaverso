import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppliedPromo } from "@/lib/types";

export type PromoLookup = { ok: true; promo: AppliedPromo & { id: string } } | { ok: false; error: string };

/**
 * Busca un código vigente (activo y con usos disponibles). Usa service_role:
 * `promo_codes` no es legible para clientes, así la lista nunca se expone.
 */
export async function findActivePromo(code: string): Promise<PromoLookup> {
  const { data, error } = await createAdminClient()
    .from("promo_codes")
    .select("id, code, discount_type, value, min_purchase, active, max_uses, times_used")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[promo] Error al leer promo_codes:", error.message);
    return { ok: false, error: "No pudimos validar el código. Intenta de nuevo." };
  }
  if (!data || !data.active) return { ok: false, error: "Este código no existe o ya no está activo." };
  if (data.max_uses !== null && data.times_used >= data.max_uses) {
    return { ok: false, error: "Este código ya fue utilizado." };
  }

  return {
    ok: true,
    promo: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      value: Number(data.value),
      min_purchase: Number(data.min_purchase),
    },
  };
}
