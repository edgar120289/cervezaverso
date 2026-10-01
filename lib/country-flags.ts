/**
 * País tal como llega del catálogo → código de FlagCDN (https://flagcdn.com).
 * Las claves van en minúsculas, sin acentos ni puntuación, así que "EE.UU.",
 * "U.S.A." y "Estados Unidos" resuelven igual. Escocia, Inglaterra y Gales
 * tienen bandera propia (gb-sct, gb-eng, gb-wls): no son la de Reino Unido.
 */
const COUNTRY_CODES: Record<string, string> = {
  alemania: "de",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgica: "be",
  bolivia: "bo",
  brasil: "br",
  bulgaria: "bg",
  canada: "ca",
  chequia: "cz",
  chile: "cl",
  china: "cn",
  colombia: "co",
  "corea del sur": "kr",
  "costa rica": "cr",
  croacia: "hr",
  cuba: "cu",
  dinamarca: "dk",
  ecuador: "ec",
  eslovaquia: "sk",
  eslovenia: "si",
  espana: "es",
  "estados unidos": "us",
  "estados unidos de america": "us",
  "united states": "us",
  usa: "us",
  "u s a": "us",
  eua: "us",
  "e u a": "us",
  eeuu: "us",
  "ee uu": "us",
  estonia: "ee",
  filipinas: "ph",
  finlandia: "fi",
  francia: "fr",
  escocia: "gb-sct",
  scotland: "gb-sct",
  inglaterra: "gb-eng",
  england: "gb-eng",
  gales: "gb-wls",
  "pais de gales": "gb-wls",
  grecia: "gr",
  guatemala: "gt",
  holanda: "nl",
  "hong kong": "hk",
  hungria: "hu",
  india: "in",
  indonesia: "id",
  irlanda: "ie",
  islandia: "is",
  israel: "il",
  italia: "it",
  jamaica: "jm",
  japon: "jp",
  letonia: "lv",
  lituania: "lt",
  luxemburgo: "lu",
  malasia: "my",
  mexico: "mx",
  noruega: "no",
  "nueva zelanda": "nz",
  "paises bajos": "nl",
  panama: "pa",
  peru: "pe",
  polonia: "pl",
  portugal: "pt",
  "puerto rico": "pr",
  "reino unido": "gb",
  "republica checa": "cz",
  "republica dominicana": "do",
  rumania: "ro",
  rusia: "ru",
  serbia: "rs",
  singapur: "sg",
  sudafrica: "za",
  suecia: "se",
  suiza: "ch",
  tailandia: "th",
  taiwan: "tw",
  turquia: "tr",
  ucrania: "ua",
  uruguay: "uy",
  venezuela: "ve",
  vietnam: "vn",
};

function normalize(country: string): string {
  return country
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** "Escocia" → "gb-sct", "EE.UU." → "us". `null` si el país no está en el diccionario. */
export function countryFlagCode(country: string): string | null {
  const key = normalize(country);
  return COUNTRY_CODES[key] ?? COUNTRY_CODES[key.replace(/ /g, "")] ?? null;
}

/** URL del SVG de la bandera en FlagCDN, o `null` si el país no se reconoce. */
export function countryFlagUrl(country: string): string | null {
  const code = countryFlagCode(country);
  return code ? `https://flagcdn.com/${code}.svg` : null;
}
