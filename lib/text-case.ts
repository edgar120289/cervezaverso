/**
 * Formato normal para mostrar textos que en la base vienen en MAYÚSCULAS (nombre, estilo, país, cervecería).
 * Solo es de presentación: no cambia los datos guardados ni el SKU.
 */

const SMALL_WORDS = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "con", "en", "a", "x", "por", "para", "al",
  "the", "of", "and", "von", "van", "der", "du", "au", "le",
]);
const KEEP_UPPER = new Set([
  "ipa", "neipa", "dipa", "ddh", "apa", "esb", "ipl", "xpa", "aipa", "ii", "iii", "iv", "vi", "vii", "viii", "ix", "usa", "uk", "ny", "nyc", "ntc", "ptc",
  "tdh", "hb", "nz", "xh", "mb", "acdc", "ita", "bbq",
]);

/** Palabra en mayúsculas → formato normal; mayúscula tras guion, barra, paréntesis o comillas, no tras apóstrofo (Fuller's). */
function capitalize(word: string, index: number): string {
  const bare = word.replace(/[^\p{L}\d]/gu, "");
  if (KEEP_UPPER.has(bare.toLowerCase())) return word.toUpperCase();
  const lower = word.toLowerCase();
  if (index > 0 && SMALL_WORDS.has(bare.toLowerCase())) return lower;
  // Elisión francesa o italiana: «d'Achouffe», «Tarot d'Or», «l'Abbaye».
  const elision = lower.match(/^([dl])['’](\p{L})(.*)$/u);
  if (elision) {
    const [, article, letter, rest] = elision;
    return (index === 0 ? article.toUpperCase() : article) + "'" + letter.toUpperCase() + rest;
  }
  const cased = lower.replace(/(^|[-/("“])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
  // Apellidos escoceses: «McEwan's», «McCallum's».
  return cased.replace(/^Mc(\p{L})/u, (_, letter: string) => "Mc" + letter.toUpperCase());
}

/**
 * Formato normal para textos en mayúsculas. Si el texto mezcla, solo se corrigen las palabras
 * en mayúsculas de 4 letras o más (y artículos como «LA»), para no deformar siglas como «BBC».
 * Las unidades quedan como «330 ml».
 */
export function normalCase(text: string): string {
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
