import type { Product } from "@/lib/types";
import { normalCase } from "@/lib/text-case";

/** Datos de producto como los lee Google (Merchant Center y datos estructurados). La tienda muestra los mismos textos en formato normal (`lib/text-case.ts`). */

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 4900;

/** Sin acentos, minúsculas y solo letras, números y espacios: para comparar textos. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Marca = cervecería de la cerveza. En colaboraciones («A / B / C») se usa la primera. Vacía si el dato no existe. */
export function googleBrand(product: Pick<Product, "brewery">): string {
  // En la base `brewery` puede venir null aunque el tipo diga string.
  const first = (product.brewery ?? "").split("/")[0].trim();
  return first ? normalCase(first) : "";
}

/** El nombre ya empieza con la marca (o con su primera palabra, para tolerar erratas como «Wendladt»). */
function startsWithBrand(name: string, brand: string): boolean {
  const foldedName = fold(name);
  const foldedBrand = fold(brand);
  if (!foldedBrand) return true;
  if (foldedName.startsWith(foldedBrand)) return true;
  const first = foldedBrand.split(" ")[0];
  return first.length >= 4 && foldedName.split(" ")[0].startsWith(first.slice(0, 4));
}

/** Marca + nombre + estilo + presentación, sin repetir lo que el nombre ya dice. Máx. 150 caracteres. */
export function googleTitle(product: Pick<Product, "name" | "brewery" | "style" | "volume_ml">): string {
  const brand = googleBrand(product);
  const name = normalCase(product.name);
  const style = normalCase(product.style);
  const volume = product.volume_ml > 0 ? `${product.volume_ml} ml` : "";

  const foldedName = fold(name);
  const compactName = foldedName.replace(/ /g, "");
  const parts = [
    brand && !startsWithBrand(name, brand) ? brand : "",
    name,
    style && !foldedName.includes(fold(style)) ? style : "",
    volume && !compactName.includes(fold(volume).replace(/ /g, "")) ? volume : "",
  ].filter(Boolean);

  const title = parts.join(" ");
  if (title.length <= MAX_TITLE_LENGTH) return title;
  const cut = title.slice(0, MAX_TITLE_LENGTH + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).trim();
}

export function googleDescription(description: string): string {
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length <= MAX_DESCRIPTION_LENGTH ? clean : `${clean.slice(0, MAX_DESCRIPTION_LENGTH - 1).trim()}…`;
}

const BEVERAGES = "Food, Beverages & Tobacco > Beverages > Alcoholic Beverages";

/** Hidromiel (vino de miel) va en Vino; todo lo demás, en Cerveza. */
export function googleCategory(product: Pick<Product, "style" | "name">): string {
  return /mead|hidromiel/i.test(`${product.style} ${product.name}`) ? `${BEVERAGES} > Wine` : `${BEVERAGES} > Beer`;
}

export function googleProductType(product: Pick<Product, "country" | "style" | "name">): string {
  const kind = /mead|hidromiel/i.test(`${product.style} ${product.name}`) ? "Hidromiel" : "Cerveza";
  return [kind, normalCase(product.country), normalCase(product.style)].filter(Boolean).join(" > ");
}
