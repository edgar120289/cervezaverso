import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewPasswordForm from "@/components/NewPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

/** Destino del enlace de recuperación (vía /auth/callback, que ya abrió la sesión). */
export default async function NuevaContrasenaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/recuperar");

  return <NewPasswordForm />;
}
