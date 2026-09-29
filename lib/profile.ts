import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Fecha de nacimiento registrada en la cuenta (AAAA-MM-DD) o null si no hay. */
export async function getProfileBirthDate(userId: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("users")
    .select("fecha_nacimiento")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[profile] No se pudo leer la fecha de nacimiento:", error.message);
    return null;
  }
  return typeof data?.fecha_nacimiento === "string" ? data.fecha_nacimiento : null;
}
