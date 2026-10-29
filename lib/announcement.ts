import { z } from "zod";

/**
 * Barra de anuncios (la barra negra de arriba). Vive en `landing_settings.announcement` y se edita en
 * /admin/landing. Los mensajes aceptan claves que se llenan solas con datos reales del catálogo y de las
 * tarifas, para que nunca queden cifras viejas escritas a mano.
 */
export const ANNOUNCEMENT_TOKENS = [
  { token: "{cervezas}", label: "cervezas activas" },
  { token: "{paises}", label: "países distintos" },
  { token: "{envio_cdmx}", label: "envío gratis CDMX" },
  { token: "{envio_nacional}", label: "envío gratis resto del país" },
  { token: "{descuento_desde}", label: "monto del descuento por volumen" },
  { token: "{descuento}", label: "% del descuento por volumen" },
] as const;

export const ANNOUNCEMENT_MESSAGE_MAX = 90;
export const MAX_ANNOUNCEMENT_MESSAGES = 6;

export const announcementSchema = z.object({
  enabled: z.boolean().default(true),
  /** `all`: arriba de todas las páginas; `home`: solo en la portada. Nunca es fija (el header ya lo es). */
  scope: z.enum(["all", "home"]).default("all"),
  messages: z
    .array(z.string().trim().min(1, "Un mensaje de la barra está vacío.").max(ANNOUNCEMENT_MESSAGE_MAX))
    .max(MAX_ANNOUNCEMENT_MESSAGES, `La barra admite hasta ${MAX_ANNOUNCEMENT_MESSAGES} mensajes.`),
  /** Ruta interna a la que lleva la barra (por ejemplo /envios). Vacío = sin enlace. */
  href: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || /^\/[^\s]*$/.test(value), "El enlace de la barra debe empezar con / (por ejemplo /envios)."),
});

export type AnnouncementSettings = z.infer<typeof announcementSchema>;

export const DEFAULT_ANNOUNCEMENT: AnnouncementSettings = {
  enabled: true,
  scope: "all",
  messages: [
    "{cervezas} cervezas de {paises} países",
    "Envío gratis en CDMX desde {envio_cdmx}",
    "Entrega en 24 a 48 h en CDMX",
    "{descuento}% en compras mayores a {descuento_desde}",
  ],
  href: "/envios",
};

export type AnnouncementValues = Record<(typeof ANNOUNCEMENT_TOKENS)[number]["token"], string>;

/** Sustituye las claves; un mensaje que pide cifras del catálogo que aún no hay (0 cervezas) se omite. */
export function resolveAnnouncement(messages: string[], values: AnnouncementValues): string[] {
  return messages
    .map((message) => {
      let text = message;
      for (const { token } of ANNOUNCEMENT_TOKENS) text = text.split(token).join(values[token]);
      return text.trim();
    })
    .filter((text, i) => text !== "" && !(messages[i].includes("{cervezas}") && values["{cervezas}"] === "0"));
}
