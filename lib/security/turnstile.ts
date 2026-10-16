import "server-only";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Valida el token de Turnstile en el servidor (cada token sirve una sola vez
 * y dura 5 minutos). Sin `TURNSTILE_SECRET_KEY` se omite fuera de producción
 * para poder desarrollar en local; en producción, sin clave, se rechaza.
 */
export async function verifyTurnstile(token: string | null | undefined, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] Falta TURNSTILE_SECRET_KEY: se rechazan los envíos.");
      return false;
    }
    return true;
  }
  if (!token || token.length > 2048) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body, cache: "no-store" });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] Token rechazado:", data["error-codes"]?.join(", "));
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] No se pudo validar el token:", err);
    return false;
  }
}
