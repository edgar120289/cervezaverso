import "server-only";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/validation";

/**
 * Búsqueda de imágenes de referencia en Open Food Facts (API pública y gratuita, sin llave)
 * y descarga segura de la imagen elegida.
 *
 * Anti-SSRF: la URL de la imagen viene de un tercero, así que sólo se descarga de la lista de
 * hosts permitidos, por HTTPS, sin seguir redirecciones, con tiempo y tamaño máximos, y el tipo
 * se decide por los bytes del archivo, no por el encabezado que declara el servidor remoto.
 */

const SEARCH_ENDPOINT = "https://world.openfoodfacts.org/cgi/search.pl";
const ALLOWED_IMAGE_HOSTS = new Set(["images.openfoodfacts.org", "static.openfoodfacts.org"]);
const USER_AGENT = "Cervezaverso-Admin/1.0 (tienda en línea de cerveza artesanal)";
const TIMEOUT_MS = 8000;

export type WebImageType = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; extension: string };

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** URLs candidatas (frente del producto) para el texto buscado, sin repetir y sólo de hosts permitidos. */
export async function findImageCandidates(query: string): Promise<string[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "12",
    fields: "image_front_url",
  });
  const res = await fetch(`${SEARCH_ENDPOINT}?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`El servicio de búsqueda respondió ${res.status}.`);

  const body: unknown = await res.json();
  const products = (body as { products?: { image_front_url?: unknown }[] }).products ?? [];
  const urls = products
    .map((product) => product.image_front_url)
    .filter((url): url is string => typeof url === "string" && isAllowedImageUrl(url));
  return [...new Set(urls)];
}

function sniffImageType(bytes: Uint8Array): WebImageType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { mime: "image/png", extension: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", extension: "webp" };
  if (ascii(4, 8) === "ftyp" && (ascii(8, 12) === "avif" || ascii(8, 12) === "avis")) {
    return { mime: "image/avif", extension: "avif" };
  }
  return null;
}

export async function downloadImage(url: string): Promise<{ bytes: Uint8Array; type: WebImageType }> {
  if (!isAllowedImageUrl(url)) throw new Error("La imagen no proviene de un origen permitido.");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error("No se pudo descargar la imagen.");

  // Se lee por partes para cortar en cuanto se pase del límite, sin cargar un archivo enorme en memoria.
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PRODUCT_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("La imagen supera los 5 MB.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const type = sniffImageType(bytes);
  if (!type) throw new Error("El archivo descargado no es una imagen JPG, PNG, WebP o AVIF.");
  return { bytes, type };
}
