/** Datos globales del sitio para SEO (metadata, sitemap, robots). */
export const SITE = {
  name: "Cervezaverso",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Tienda en línea de cerveza artesanal nacional e importada. Estilos, orígenes y maridajes seleccionados, con envío a todo México.",
  locale: "es_MX",
} as const;

/** Canales de contacto y redes (Footer, botón de WhatsApp y /contacto). */
export const CONTACT = {
  whatsappUrl: "https://wa.me/525643075041",
  whatsappLabel: "+52 56 4307 5041",
  phoneUrl: "tel:+525643075041",
  instagramUrl: "https://instagram.com/Cervezaverso",
  facebookUrl: "https://facebook.com/Cervezaverso",
  handle: "@Cervezaverso",
  /** Correo de atención: déjalo en null hasta tener uno oficial (la tarjeta se oculta). */
  email: null as string | null,
} as const;

/** Leyenda sanitaria obligatoria para bebidas alcohólicas (pendiente de revisión legal). */
export const HEALTH_NOTICE = "El abuso en el consumo de este producto es nocivo para la salud.";

/** Nombre de la Sommelier digital (quiz, chat, botón flotante y banner de la portada). */
export const SOMMELIER_NAME = "Graciela";

/** Tarrito kawaii del Sommelier (botón flotante, quiz y presentación en la landing). */
export const SOMMELIER_MASCOT = "/img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo/14-kawaii-sonriente.png";
