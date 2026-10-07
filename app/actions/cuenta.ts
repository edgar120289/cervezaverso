"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TRIBU_IDS } from "@/lib/tribus";
import { avatarUrlPrefix } from "@/lib/avatar";

/** Cada acción usa el cliente con la sesión del visitante: RLS limita todo a sus propias filas. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cuenta");
  return { supabase, user };
}

const idSchema = z.uuid();

export async function eliminarDireccion(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  await supabase.from("direcciones").delete().eq("id", id.data).eq("user_id", user.id);
  refresh();
}

export async function elegirTribu(tribu: string): Promise<{ ok: boolean }> {
  const parsed = z.enum(TRIBU_IDS).safeParse(tribu);
  if (!parsed.success) return { ok: false };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("users").update({ avatar_team: parsed.data }).eq("id", user.id);
  if (error) {
    console.error("[cuenta] No se pudo guardar el team", error.code);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

/** Guarda la URL de la foto ya subida; solo acepta archivos del bucket público dentro de la carpeta del propio usuario. */
export async function guardarAvatar(url: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const parsed = z.string().max(500).safeParse(url);
  if (!base || !parsed.success || !parsed.data.startsWith(avatarUrlPrefix(base, user.id))) return { ok: false };
  const { error } = await supabase.from("users").update({ avatar_url: parsed.data }).eq("id", user.id);
  if (error) {
    console.error("[cuenta] No se pudo guardar la foto", error.code);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

export async function hacerPredeterminada(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  // El índice único permite una sola predeterminada: primero se quitan las demás.
  await supabase.from("direcciones").update({ predeterminada: false }).eq("user_id", user.id);
  await supabase.from("direcciones").update({ predeterminada: true }).eq("id", id.data).eq("user_id", user.id);
  refresh();
}
