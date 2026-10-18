import "server-only";
import { createHash } from "node:crypto";

type CapiPurchase = {
  /** Id del pedido: el mismo `eventID` que envía el Pixel en el navegador, para deduplicar. */
  orderId: string;
  total: number;
  email?: string | null;
  phone?: string | null;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Meta pide minúsculas sin espacios (correo) y solo dígitos (teléfono) antes de aplicar el hash. */
function hashedUserData(email?: string | null, phone?: string | null) {
  const userData: { em?: string[]; ph?: string[] } = {};
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) userData.em = [sha256(normalizedEmail)];
  const digits = phone?.replace(/\D/g, "");
  if (digits) userData.ph = [sha256(digits)];
  return userData;
}

/**
 * Envía el evento Purchase a la API de Conversiones de Meta. Nunca lanza: si Meta falla o el
 * token es inválido solo se registra el error, para no devolver 500 a Mercado Pago.
 */
export async function sendMetaPurchase({ orderId, total, email, phone }: CapiPurchase): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_id: orderId,
            custom_data: { currency: "MXN", value: total },
            user_data: hashedUserData(email, phone),
          },
        ],
      }),
    });
    if (!response.ok) console.error("[meta-capi] Meta respondió con estado", response.status);
  } catch (err) {
    console.error("[meta-capi] No se pudo enviar Purchase:", err instanceof Error ? err.message : err);
  }
}
