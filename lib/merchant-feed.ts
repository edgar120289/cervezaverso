import type { Product } from "@/lib/types";

/** Datos de producto como los lee Google (Merchant Center y datos estructurados). La tienda sigue mostrando el nombre original. */

const SMALL_WORDS = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "con", "en", "a", "x", "por", "para", "al",
  "the", "of", "and", "von", "van", "der", "du", "au", "le",
]);
const KEEP_UPPER = new Set([
  "ipa", "neipa", "dipa", "ddh", "apa", "esb", "ipl", "xpa", "aipa", "ii", "iii", "iv", "vi", "vii", "viii", "ix", "usa", "uk", "ny",
]);

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 4900;

/** Palabra en mayúsculas → formato normal; mayúscula tras guion, barra, paréntesis o comillas, no tras apóstrofo (Fuller's). */
function capitalize(word: string, index: number): string {
  const bare = word.replace(/[^\p{L}\d]/gu, "");
  if (KEEP_UPPER.has(bare.toLowerCase())) return word.toUpperCase();
  const lower = word.toLowerCase();
  if (index > 0 && SMALL_WORDS.has(bare.toLowerCase())) return lower;
  return lower.replace(/(^|[-/("“])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * Formato normal para textos en mayúsculas. Si el texto mezcla, solo se corrigen las palabras
 * en mayúsculas de 4 letras o más (y artículos como «LA»), para no deformar siglas como «BBC».
 * Las unidades quedan como «330 ml».
 */
function normalCase(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const shouting = !/\p{Ll}/u.test(clean);
  return clean
    .split(" ")
    .map((word, index) => {
      if (shouting) return capitalize(word, index);
      const letters = word.replace(/[^\p{L}]/gu, "");
      const upper = letters.length > 0 && letters === letters.toUpperCase() && !/\p{Ll}/u.test(letters);
      const bare = letters.toLowerCase();
      return upper && (letters.length >= 4 || SMALL_WORDS.has(bare)) ? capitalize(word, index) : word;
    })
    .join(" ")
    .replace(/(\d)\s*ml(?!\p{L})/giu, "$1 ml");
}

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
