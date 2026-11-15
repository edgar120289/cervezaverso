/**
 * Frases permitidas en las piezas de redes que genera `/redes/pieza`.
 * La ruta es pública (Meta descarga la imagen), así que el texto nunca viene libre en la URL: solo un id de esta lista.
 * `kicker` es la línea chica de arriba y `big` el titular. Máximo ~12 palabras en total.
 */
export type Frase = { kicker: string; big: string };

const EN = "La encuentras en";
const SITE = "cervezaverso.com";
const EN_SITE = `${EN} ${SITE}`;

export const FRASES: Record<string, Frase> = {
  // Producto
  encuentras: { kicker: EN, big: SITE },
  puerta: { kicker: "Del mundo a tu puerta", big: SITE },
  dia: { kicker: "Cerveza del día", big: EN_SITE },
  llego: { kicker: "Ya está en", big: SITE },
  // Portadas de carrusel
  "c-belgica": { kicker: EN_SITE, big: "Bélgica en 5 botellas" },
  "c-trigo": { kicker: EN_SITE, big: "Trigo alemán, como debe ser" },
  "c-oscuras": { kicker: EN_SITE, big: "Oscuras para el frío" },
  "c-mexico": { kicker: EN_SITE, big: "Hecho en México" },
  "c-cien": { kicker: EN_SITE, big: "Importadas por menos de $100" },
  "c-regalo": { kicker: EN_SITE, big: "Botellas que se envuelven solas" },
  "c-invierno": { kicker: EN_SITE, big: "Sabores de invierno" },
  "c-sin": { kicker: EN_SITE, big: "Sin alcohol, con todo el sabor" },
  "c-frutales": { kicker: EN_SITE, big: "Frutales: ni tan cerveza, ni tan postre" },
  // Humor (una cada 3 días)
  "h-abuelita": { kicker: EN_SITE, big: "Las únicas lágrimas de tu abuelita que sí querías ver." },
  "h-lunes": { kicker: EN_SITE, big: "Negra, amarga y fría. Como los lunes." },
  "h-vaquita": { kicker: EN_SITE, big: "En el mar quedan menos de diez. Aquí todavía hay." },
  "h-historial": { kicker: EN_SITE, big: "Más oscura que tu historial de búsqueda." },
  "h-conductor": { kicker: EN_SITE, big: "Para el que maneja. Alguien tiene que llegar vivo." },
  "h-santa": { kicker: EN_SITE, big: "Santa sí existe. Mide 330 ml." },
  "h-mago": { kicker: EN_SITE, big: "El único mago que sí aparece en tu puerta." },
  "h-corazon": { kicker: EN_SITE, big: "Corazón negro. Por fin uno que no es el de tu ex." },
  "h-foca": { kicker: EN_SITE, big: "Una foca que habla. Y no es lo más raro de tu semana." },
  "h-lagrimas": { kicker: EN_SITE, big: "Las únicas lágrimas negras que no manchan la almohada." },
};
