import { PRODUCT_IMAGE_MAX_SIDE, PRODUCT_IMAGE_QUALITY, PRODUCT_THUMB_SIZE } from "./product-images";

export type ResizedProductImage = { full: Blob; thumb: Blob };

async function toWebp(source: ImageBitmap, maxSide: number): Promise<Blob> {
  // Nunca se agranda: una foto más chica que `maxSide` conserva su tamaño.
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no pudo procesar la imagen.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", PRODUCT_IMAGE_QUALITY),
  );
  // Los navegadores sin codificador WebP devuelven PNG: mejor avisar que subir un archivo pesado.
  if (!blob || blob.type !== "image/webp") throw new Error("Tu navegador no puede convertir imágenes a WebP.");
  return blob;
}

/** Redimensiona en el navegador: foto grande (máx. 1200 px) y miniatura (480 px), ambas WebP. */
export async function resizeProductImage(file: File): Promise<ResizedProductImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name}: no se pudo leer la imagen.`);
  }
  try {
    const full = await toWebp(bitmap, PRODUCT_IMAGE_MAX_SIDE);
    const thumb = await toWebp(bitmap, PRODUCT_THUMB_SIZE);
    return { full, thumb };
  } finally {
    bitmap.close();
  }
}
