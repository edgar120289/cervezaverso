"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { firstIssue, promoCreateSchema, type PromoCreate } from "@/lib/validation";

export type CuponResult = { ok: true } | { ok: false; error: string };

export async function crearCupon(input: PromoCreate): Promise<CuponResult> {
  const parsed = promoCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await requireAdmin("/admin/cupones");
  const { error } = await supabase.from("promo_codes").insert(parsed.data);
  if (error) {
    // 23505 = unique_violation
    if (error.code === "23505") return { ok: false, error: `El código ${parsed.data.code} ya existe.` };
    return { ok: false, error: error.message };
  }

  refresh();
  return { ok: true };
}

const toggleSchema = z.object({ id: z.uuid(), active: z.boolean() });

/** Activa o desactiva un cupón. No se borran: los pedidos conservan el código usado. */
export async function cambiarEstadoCupon(id: string, active: boolean): Promise<CuponResult> {
  const parsed = toggleSchema.safeParse({ id, active });
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await requireAdmin("/admin/cupones");
  const { data, error } = await supabase
    .from("promo_codes")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se encontró el cupón." };

  refresh();
  return { ok: true };
}
