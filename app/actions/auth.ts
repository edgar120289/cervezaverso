"use server";

import { createClient } from "@/lib/supabase/server";
import { guardPublicForm } from "@/lib/security/form-guard";
import { firstIssue, loginSchema, recoverSchema, signupSchema } from "@/lib/validation";
import { safeNextPath } from "@/lib/safe-next";
import { SITE, SPAM_HINT } from "@/lib/site";
import type { UserRole } from "@/lib/types";

/**
 * Con "Captcha protection" activo en Supabase Auth (Authentication → Attack Protection), Supabase exige
 * `captchaToken` en cada llamada y consume el token, así que aquí no se valida por segunda vez.
 * Con `SUPABASE_AUTH_CAPTCHA=true` el token viaja a Supabase; sin ella, lo valida solo el servidor (siteverify).
 */
const SUPABASE_CAPTCHA = process.env.SUPABASE_AUTH_CAPTCHA === "true";

function captchaOptions(token: string | null | undefined) {
  return SUPABASE_CAPTCHA && token ? { captchaToken: token } : {};
}

export type AuthResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Acceso, registro y recuperación pasan por el servidor para aplicar el mismo
 * filtro que el resto de formularios públicos (honeypot, límite de intentos y
 * Turnstile) y para validar la fecha de nacimiento antes de crear la cuenta.
 */
export async function iniciarSesion(input: unknown): Promise<AuthResult<{ role: UserRole }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { email, password, website, turnstileToken } = parsed.data;

  const guard = await guardPublicForm("login", { honeypot: website, turnstileToken, deferCaptcha: SUPABASE_CAPTCHA });
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaOptions(turnstileToken),
  });
  if (error || !data.user) {
    if (error) console.error("[auth] Error al iniciar sesión:", error.code, error.status, error.message);
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: `Confirma tu correo con el enlace que te enviamos antes de entrar. ${SPAM_HINT}` };
    }
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).maybeSingle();
  return { ok: true, role: profile?.role === "admin" ? "admin" : "client" };
}

export async function registrarCuenta(input: unknown): Promise<AuthResult<{ needsConfirmation: boolean }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { email, password, fecha_nacimiento, next, website, turnstileToken } = parsed.data;

  const guard = await guardPublicForm("signup", { honeypot: website, turnstileToken, deferCaptcha: SUPABASE_CAPTCHA });
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...captchaOptions(turnstileToken),
      // El trigger `handle_new_user` (migración 005) la copia a public.users y vuelve a validar los 18 años.
      data: { fecha_nacimiento },
      emailRedirectTo: `${SITE.url}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`,
    },
  });
  if (error) {
    console.error("[auth] Error al registrar:", error.code, error.message);
    return { ok: false, error: "No pudimos crear tu cuenta. Revisa tus datos o intenta más tarde." };
  }
  return { ok: true, needsConfirmation: !data.session };
}

export async function solicitarRecuperacion(input: unknown): Promise<AuthResult> {
  const parsed = recoverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { email, website, turnstileToken } = parsed.data;

  const guard = await guardPublicForm("recover", { honeypot: website, turnstileToken, deferCaptcha: SUPABASE_CAPTCHA });
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE.url}/auth/callback?next=/recuperar/nueva`,
    ...captchaOptions(turnstileToken),
  });
  // Mismo resultado exista o no la cuenta: no revela qué correos están registrados.
  if (error) console.error("[auth] Error al enviar recuperación:", error.code, error.message);
  return { ok: true };
}
