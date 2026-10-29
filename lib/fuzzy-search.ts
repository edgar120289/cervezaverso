/**
 * Búsqueda tolerante a errores de dedo para el catálogo.
 *
 * La búsqueda normal (`matchesFilters`) ya ignora acentos y mayúsculas, pero exige el texto tal cual.
 * Cuando una palabra buscada no aparece en ninguna cerveza («shoferhofer», «hefeweisen»), aquí se busca
 * la palabra del catálogo más parecida y se propone la búsqueda corregida («schöfferhofer», «hefeweizen»).
 * Todo corre en el navegador sobre el catálogo ya cargado; no hay llamadas al servidor.
 */
import { normalize, searchHaystack, wordMatches, type FilterableProduct } from "@/lib/catalog-filters";

/**
 * Errores de dedo permitidos según el largo de la palabra: las cortas no se corrigen (ipa, ale) y
 * hasta 7 letras solo 1, para no cambiar palabras reales por otras («corona» no es «toronja»).
 */
export function maxTypos(length: number): number {
  if (length < 4) return 0;
  if (length < 8) return 1;
  return 2;
}

/**
 * Distancia de edición con transposiciones (Damerau, versión «optimal string alignment»):
 * cuenta letras de más, de menos, cambiadas o volteadas («stuot» → «stout» = 1).
 * Devuelve `max + 1` en cuanto sabe que la distancia supera `max`.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev;
    prev = current;
  }
  return prev[b.length];
}

const WORD = /[\p{L}\d]+/gu;

/** Palabras sin acentos ni mayúsculas, para comparar. */
function words(text: string): string[] {
  return normalize(text).match(WORD) ?? [];
}

export type Vocabulary = Map<string, { display: string; count: number }>;

/**
 * Palabras de nombre, cervecería, estilo y país, con cuántas cervezas las usan.
 * `display` conserva los acentos («schöfferhofer») para mostrar la sugerencia.
 */
export function buildVocabulary(products: FilterableProduct[]): Vocabulary {
  const vocabulary: Vocabulary = new Map();
  for (const product of products) {
    const seen = new Set<string>();
    const text = [product.name, product.brewery, product.style, product.country].filter(Boolean).join(" ");
    for (const raw of text.toLocaleLowerCase("es-MX").match(WORD) ?? []) {
      const key = normalize(raw);
      if (key.length < 3 || /^\d+$/.test(key) || seen.has(key)) continue;
      seen.add(key);
      const entry = vocabulary.get(key);
      if (entry) entry.count += 1;
      else vocabulary.set(key, { display: raw, count: 1 });
    }
  }
  return vocabulary;
}

/** La palabra del catálogo más parecida a `word`, o `null` si ninguna está a pocos errores. */
export function closestWord(word: string, vocabulary: Vocabulary): string | null {
  const max = maxTypos(word.length);
  if (max === 0) return null;
  let best: { display: string; distance: number; prefix: number; count: number } | null = null;
  for (const [key, entry] of vocabulary) {
    let distance = editDistance(word, key, max);
    let prefix = 0;
    // Palabra a medio escribir: «schofer» contra el inicio de «schofferhofer».
    if (distance > max && key.length > word.length) {
      distance = editDistance(word, key.slice(0, word.length), max);
      prefix = 1;
    }
    if (distance > max) continue;
    const better =
      !best ||
      distance < best.distance ||
      (distance === best.distance && prefix < best.prefix) ||
      (distance === best.distance && prefix === best.prefix && entry.count > best.count);
    if (better) best = { display: entry.display, distance, prefix, count: entry.count };
  }
  return best?.display ?? null;
}

/**
 * Búsqueda corregida, o `null` si no hace falta o no se puede corregir.
 * Solo se cambian las palabras que no aparecen en ninguna cerveza; las demás se dejan como las escribió.
 */
export function correctQuery(query: string, products: FilterableProduct[], vocabulary: Vocabulary): string | null {
  const parts = query.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const haystacks = products.map(searchHaystack);
  let changed = false;
  const corrected: string[] = [];
  for (const part of parts) {
    const key = normalize(part);
    if (haystacks.some((haystack) => wordMatches(key, haystack))) {
      corrected.push(part);
      continue;
    }
    const suggestion = closestWord(key, vocabulary);
    if (!suggestion) return null;
    corrected.push(suggestion);
    changed = true;
  }
  return changed ? corrected.join(" ") : null;
}

/** ¿`term` aparece en `text`, aunque traiga algún error de dedo? (buscador de la lista de cervecerías). */
export function fuzzyIncludes(term: string, text: string): boolean {
  const key = normalize(term);
  if (!key) return true;
  if (normalize(text).includes(key)) return true;
  const max = maxTypos(key.length);
  if (max === 0) return false;
  return words(text).some(
    (word) =>
      editDistance(key, word, max) <= max ||
      (word.length > key.length && editDistance(key, word.slice(0, key.length), max) <= max)
  );
}
