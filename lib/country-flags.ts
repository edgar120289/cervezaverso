/** Países en español (sin acentos, minúsculas) → código ISO 3166-1 alfa-2. */
const COUNTRY_CODES: Record<string, string> = {
  alemania: "DE",
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  belgica: "BE",
  brasil: "BR",
  canada: "CA",
  chequia: "CZ",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  "corea del sur": "KR",
  croacia: "HR",
  cuba: "CU",
  dinamarca: "DK",
  escocia: "GB",
  espana: "ES",
  "estados unidos": "US",
  eeuu: "US",
  filipinas: "PH",
  finlandia: "FI",
  francia: "FR",
  grecia: "GR",
  guatemala: "GT",
  holanda: "NL",
  hungria: "HU",
  inglaterra: "GB",
  india: "IN",
  irlanda: "IE",
  islandia: "IS",
  israel: "IL",
  italia: "IT",
  jamaica: "JM",
  japon: "JP",
  mexico: "MX",
  noruega: "NO",
  "nueva zelanda": "NZ",
  "paises bajos": "NL",
  peru: "PE",
  polonia: "PL",
  portugal: "PT",
  "puerto rico": "PR",
  "reino unido": "GB",
  "republica checa": "CZ",
  rusia: "RU",
  singapur: "SG",
  sudafrica: "ZA",
  suecia: "SE",
  suiza: "CH",
  tailandia: "TH",
  turquia: "TR",
  ucrania: "UA",
  uruguay: "UY",
  vietnam: "VN",
};

const FALLBACK_FLAG = "🌍";

/** "Bélgica" → "🇧🇪". Si el país no está en la lista devuelve un globo. */
export function countryFlag(country: string): string {
  const key = country
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const code = COUNTRY_CODES[key];
  if (!code) return FALLBACK_FLAG;
  return String.fromCodePoint(...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}
