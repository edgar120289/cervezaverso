import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** Límites por acción: `max` intentos por IP dentro de `windowSeconds`. */
export const RATE_LIMITS = {
  login: { max: 8, windowSeconds: 15 * 60 },
  signup: { max: 5, windowSeconds: 60 * 60 },
  recover: { max: 5, windowSeconds: 60 * 60 },
  checkout: { max: 10, windowSeconds: 15 * 60 },
  promo: { max: 20, windowSeconds: 15 * 60 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Cuenta un intento en Supabase (`check_rate_limit`, migración 005) y dice si
 * sigue dentro del límite. La IP se guarda como hash, no en claro. Si la base
 * no responde se deja pasar: un fallo del contador no debe tumbar la tienda
 * (Turnstile y el firewall de la plataforma siguen activos).
 */
export async function isWithinRateLimit(action: RateLimitAction, ip: string | null): Promise<boolean> {
  const { max, windowSeconds } = RATE_LIMITS[action];
  const key = `${action}:${createHash("sha256").update(ip ?? "sin-ip").digest("hex").slice(0, 32)}`;
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] No se pudo registrar el intento:", err);
    return true;
  }
}
