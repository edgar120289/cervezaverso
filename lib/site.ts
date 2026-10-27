/** Datos globales del sitio para SEO (metadata, sitemap, robots). */
export const SITE = {
  name: "Cervezaverso",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://cervezaverso.com").replace(/\/$/, ""),
  /** Título por defecto: no repite la descripción. */
  title: "Cervezaverso | Tienda de Cervezas del Mundo",
  description:
    "Descubre y compra las mejores cervezas artesanales e importadas. El universo de la cerveza entregado en la puerta de tu casa a todo México.",
  locale: "es_MX",
} as const;

/** Datos fiscales oficiales: avisos legales, Footer y correos. "Cervezaverso" queda como nombre comercial. */
export const LEGAL = {
  razonSocial: "Cervezaverso S.A.S. de C.V.",
  rfc: "CER231101TZ7",
  domicilio: "República del Salvador #2, Col. Centro (Área 1), C.P. 06000, Alcaldía Cuauhtémoc, Ciudad de México.",
  horario: "Lunes a Domingo de 09:00 a 21:00 hrs.",
  emailFacturas: "facturas@cervezaverso.com",
} as const;

/** Canales de contacto y redes (Footer, botón de WhatsApp y /contacto). */
export const CONTACT = {
  whatsappUrl: "https://wa.me/525643075041",
  whatsappLabel: "+52 56 4307 5041",
  phoneUrl: "tel:+525643075041",
  instagramUrl: "https://www.instagram.com/cervezaverso/",
  facebookUrl: "https://www.facebook.com/Cervezaverso/",
  handle: "@Cervezaverso",
  email: "contacto@cervezaverso.com",
} as const;

/** Datos bancarios para pagos por transferencia interbancaria (públicos, se muestran al cliente). */
export const BANK_TRANSFER = {
  beneficiario: "Cervezaverso S.A.S de C.V.",
  banco: "STP / Fondeadora",
  clabe: "699180600006072378",
} as const;

/** Leyenda sanitaria obligatoria para bebidas alcohólicas (pendiente de revisión legal). */
export const HEALTH_NOTICE = "El abuso en el consumo de este producto es nocivo para la salud.";

/** Nombre de la Sommelier digital (quiz, botón flotante y banner de la portada). */
export const SOMMELIER_NAME = "Graciela";

/** Tarrito kawaii del Sommelier (botón flotante, quiz y presentación en la landing). */
export const SOMMELIER_MASCOT = "/img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo/14-kawaii-sonriente.png";
