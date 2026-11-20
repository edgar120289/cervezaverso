import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "@/lib/site";

/** Vigencia del enlace de solo lectura del PDF. */
export const ENLACE_PDF_DIAS = 7;

// Llave derivada de la service role (ya es secreta y solo existe en el servidor): sin variable nueva.
function llave(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createHmac("sha256", base).update("cervezaverso:pedido-pdf:v1").digest();
}

function firma(id: string, exp: number): string {
  return createHmac("sha256", llave()).update(`${id}.${exp}`).digest("base64url");
}

/** Enlace firmado al PDF de un pedido, de solo lectura y con vencimiento. */
export function enlacePdfFirmado(id: string, dias = ENLACE_PDF_DIAS): { url: string; expira: Date } {
  const exp = Math.floor(Date.now() / 1000) + dias * 86400;
  return { url: `${SITE.url}/pedido/${id}/pdf?exp=${exp}&sig=${firma(id, exp)}`, expira: new Date(exp * 1000) };
}

export function verificarEnlacePdf(id: string, exp: string | null, sig: string | null): boolean {
  if (!exp || !sig || !/^\d{1,12}$/.test(exp)) return false;
  const vence = Number(exp);
  if (vence * 1000 < Date.now()) return false;
  const esperada = Buffer.from(firma(id, vence));
  const recibida = Buffer.from(sig);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
