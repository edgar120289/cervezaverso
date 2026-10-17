const MAX_ID_LENGTH = 50;

/** Hash FNV-1a de 32 bits en hexadecimal; sin dependencias para poder usarse también en el navegador. */
function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * ID del producto en el feed de Merchant Center y en los eventos del Meta Pixel. Google limita
 * `g:id` a 50 caracteres: si el SKU es más largo, se recorta y se añade un hash para que siga
 * siendo único y estable.
 */
export function feedId(sku: string): string {
  if (sku.length <= MAX_ID_LENGTH) return sku;
  return `${sku.slice(0, MAX_ID_LENGTH - 9)}-${shortHash(sku)}`;
}
