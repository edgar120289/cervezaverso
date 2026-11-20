import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { ligarPedidosInvitado } from "@/lib/pedidos-invitado";

/** Destino del enlace de confirmación de correo: canjea el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google, confirmación de correo y recuperación: los pedidos de invitado con ese correo pasan a la cuenta.
      if (data.user) await ligarPedidosInvitado(data.user.id);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmacion", origin));
}
