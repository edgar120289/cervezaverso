/** Carpetas de `public/` que alimentan la identidad visual. */
export const MEDIA_DIRS = {
  /** Tarros recortados (sin fondo): logo del header. */
  tarros: "img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo",
  /** Capas de tarro alineadas al marco circular (1024×1024). */
  capasCirculares: "img/cervezaverso-logos-v2/capas-tarro/circular",
  marcoCircular: "img/cervezaverso-logos-v2/marcos/marco-circular.png",
  marcoHorizontal: "img/cervezaverso-logos-v2/marcos/marco-horizontal.png",
} as const;

/** Imagen de marca que no vive en `MEDIA_DIRS` y también se optimiza (la mascota de Graciela). */
export const MASCOT_FILE = "img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo/14-kawaii-sonriente.png";

/** Anchos (px) de las WebP generadas por `scripts/optimizar-marca.ts`. */
export const BRAND_WIDTHS = { small: 160, large: 480 } as const;

/** Raíz de las WebP generadas, dentro de `public/`. */
export const OPTIMIZED_DIR = "img/optimizadas";

/**
 * Convierte la URL de un PNG de marca (`/img/.../<carpeta>/<nombre>.png`) en la de su WebP
 * optimizada (`/img/optimizadas/<carpeta>/<nombre>-<ancho>.webp`). Hasta 80 px usa la de
 * 160 px de ancho; por encima, la de 480 px. Lo que no sea un PNG se devuelve igual.
 */
export function optimizedBrandSrc(src: string, size: number): string {
  const match = /^\/?(?:.*\/)?([^/]+)\/([^/]+)\.png$/i.exec(src);
  if (!match) return src;
  const width = size <= 80 ? BRAND_WIDTHS.small : BRAND_WIDTHS.large;
  return `/${OPTIMIZED_DIR}/${match[1]}/${match[2]}-${width}.webp`;
}
