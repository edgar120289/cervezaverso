import "server-only";
import { headers } from "next/headers";
import { isHoneypotFilled } from "@/lib/validation";
import { isWithinRateLimit, type RateLimitAction } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

export type GuardResult = { ok: true } | { ok: false; error: string };

/** IP del visitante según el proxy de la plataforma (Vercel llena `x-forwarded-for`). */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/**
 * Filtro común de todo formulario público, antes de tocar datos:
 * honeypot → límite de intentos por IP → Turnstile. Los mensajes son genéricos;
 * el detalle queda en los logs del servidor.
 */
export async function guardPublicForm(
  action: RateLimitAction,
  { honeypot, turnstileToken }: { honeypot?: unknown; turnstileToken?: string | null }
): Promise<GuardResult> {
  if (isHoneypotFilled(honeypot)) return { ok: false, error: "No pudimos procesar tu solicitud." };

  const ip = await getClientIp();
  if (!(await isWithinRateLimit(action, ip))) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." };
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, error: "No pudimos verificar que eres una persona. Recarga la página e intenta de nuevo." };
  }
  return { ok: true };
}
