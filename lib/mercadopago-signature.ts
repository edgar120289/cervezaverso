import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica la firma `x-signature` de los webhooks de Mercado Pago:
 * HMAC-SHA256 (hex) de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con `MP_WEBHOOK_SECRET`.
 * Sin secreto configurado rechaza todo (falla cerrado).
 */
export function isValidMercadoPagoSignature(request: Request, dataId: string | null): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const header = request.headers.get("x-signature");
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=");
      return [key, value.join("=")];
    })
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const requestId = request.headers.get("x-request-id");
  // Mercado Pago pide el id en minúsculas cuando es alfanumérico.
  const manifest = [
    dataId ? `id:${dataId.toLowerCase()};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${ts};`,
  ].join("");

  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");
  const recibido = Buffer.from(v1, "hex");
  const calculado = Buffer.from(esperado, "hex");
  return recibido.length === calculado.length && timingSafeEqual(recibido, calculado);
}
