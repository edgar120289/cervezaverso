import { PRODUCT_IMAGE_BUCKET } from "./validation";

/** Lado mayor (px) de la miniatura que se guarda junto a cada foto de producto. */
export const PRODUCT_THUMB_SIZE = 480;
/** Lado mayor (px) de la foto grande que se sube desde el panel. */
export const PRODUCT_IMAGE_MAX_SIDE = 1200;
export const PRODUCT_IMAGE_QUALITY = 0.82;

const THUMB_SUFFIX = `-${PRODUCT_THUMB_SIZE}.webp`;

/** Ruta de la miniatura dentro del bucket: `<nombre>.<ext>` → `<nombre>-480.webp`. */
export function productThumbPath(path: string): string {
  return path.replace(/\.[a-z0-9]+$/i, "") + THUMB_SUFFIX;
}

export function isProductThumbPath(path: string): boolean {
  return path.endsWith(THUMB_SUFFIX);
}

/**
 * URL de la miniatura de una foto de producto. Solo aplica a las del bucket de productos;
 * cualquier otra URL se devuelve igual. La miniatura puede no existir (fotos subidas antes
 * de este cambio): `ProductImage` vuelve a la original si falla.
 */
export function productThumbUrl(url: string): string {
  if (!url.includes(`/${PRODUCT_IMAGE_BUCKET}/`) || isProductThumbPath(url)) return url;
  return productThumbPath(url);
}
