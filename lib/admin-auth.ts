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

/** Como requireAdmin, pero también devuelve el correo del admin (autor en la bitácora de pedidos). */
export async function requireAdminUser(next = "/admin") {
  const supabase = await requireAdmin(next);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, email: user?.email ?? "admin" };
}

/** Para Route Handlers del panel: true solo con sesión de admin (sin redirigir). */
export async function isAdminSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}
