import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let client: MercadoPagoConfig | null = null;

/** Cliente del SDK. El token vive solo en el servidor (`MP_ACCESS_TOKEN`), nunca en una variable pública. */
function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta la variable de entorno MP_ACCESS_TOKEN.");
  client ??= new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
  return client;
}

export const mpPreference = () => new Preference(getClient());
export const mpPayment = () => new Payment(getClient());
