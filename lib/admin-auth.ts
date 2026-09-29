import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Para Server Actions del panel: exige sesión de admin y devuelve el cliente
 * con esa sesión, así RLS (is_admin()) vuelve a validar cada escritura.
 */
export async function requireAdmin(next = "/admin") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return supabase;
}
