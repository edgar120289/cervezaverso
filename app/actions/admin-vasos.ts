"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { VASO_CODES } from "@/lib/vasos";

export type VasoActionResult = { ok: true } | { ok: false; error: string };

const cambiarVasoSchema = z.object({
  id: z.uuid(),
  // null = «Sin asignar»; también queda como 'manual' para que ninguna asignación automática lo pise.
  vaso: z.enum(VASO_CODES).nullable(),
});

/** Cambia el vaso de una cerveza desde /admin/vasos. Todo cambio hecho aquí queda como 'manual'. */
export async function cambiarVaso(id: string, vaso: string | null): Promise<VasoActionResult> {
  const parsed = cambiarVasoSchema.safeParse({ id, vaso });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  // Sesión del admin: RLS (is_admin()) vuelve a validar la escritura.
  const supabase = await requireAdmin("/admin/vasos");
  const { data, error } = await supabase
    .from("products")
    .update({ vaso: parsed.data.vaso, vaso_origen: "manual" })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) {
    console.error("[admin] No se pudo guardar el vaso:", error.message);
    return { ok: false, error: "No se pudo guardar el vaso. Intenta de nuevo." };
  }
  if (!data?.length) return { ok: false, error: "No se pudo guardar: el producto no existe o no tienes permiso." };

  refresh();
  return { ok: true };
}
