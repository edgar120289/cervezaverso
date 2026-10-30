import { z } from "zod";

/** Publicaciones de redes (tabla `redes_publicaciones`, migración 027). Compartido entre cliente y servidor. */

export const REDES_BUCKET = "redes";
export const REDES = ["instagram", "facebook"] as const;
export type Red = (typeof REDES)[number];
export const FORMATOS = ["feed", "historia"] as const;
export type Formato = (typeof FORMATOS)[number];
export type EstadoPublicacion = "borrador" | "aprobada" | "publicando" | "publicada" | "error";

export type Publicacion = {
  id: string;
  titulo: string;
  caption: string;
  imagenes: string[];
  redes: Red[];
  formato: Formato;
  programada_para: string;
  estado: EstadoPublicacion;
  nota: string | null;
  ig_media_id: string | null;
  fb_post_id: string | null;
  error: string | null;
  publicada_at: string | null;
};

export const PUBLICACION_COLUMNS =
  "id, titulo, caption, imagenes, redes, formato, programada_para, estado, nota, ig_media_id, fb_post_id, error, publicada_at";

export const publicacionSchema = z.object({
  id: z.uuid().optional(),
  titulo: z.string().trim().min(1, "Ponle un título (solo lo ves tú).").max(120),
  caption: z.string().max(2200, "Instagram admite hasta 2,200 caracteres."),
  imagenes: z.array(z.url()).max(10, "Instagram admite hasta 10 imágenes por carrusel."),
  redes: z.array(z.enum(REDES)).min(1, "Elige al menos una red."),
  formato: z.enum(FORMATOS).default("feed"),
  programada_para: z.iso.datetime({ offset: true }),
});
export type PublicacionInput = z.input<typeof publicacionSchema>;

/** CDMX no tiene horario de verano desde 2022: siempre UTC−6. */
const CDMX_OFFSET = "-06:00";

/** `2026-10-30T19:00` (hora de CDMX, de un input datetime-local) → ISO con zona. */
export function cdmxLocalToIso(local: string): string {
  return new Date(`${local}:00${CDMX_OFFSET}`).toISOString();
}

/** ISO → `2026-10-30T19:00` en hora de CDMX, para el input datetime-local. */
export function isoToCdmxLocal(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 6 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function formatCdmx(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
