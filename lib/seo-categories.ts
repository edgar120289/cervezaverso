import type { Product } from "@/lib/types";

/** Minúsculas, sin acentos ni puntuación: "Rep. Checa" y "REP CHECA" comparan igual. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type CountryCategory = {
  slug: string;
  name: string;
  /** Valores de `products.country` (ya normalizados) que cuentan para esta página. */
  aliases: string[];
};

export type StyleCategory = {
  slug: string;
  name: string;
  /** Texto del H1: «Cerveza tipo Stout». */
  heading: string;
  match: RegExp;
  exclude?: RegExp;
};

export const COUNTRY_CATEGORIES: CountryCategory[] = [
  { slug: "mexico", name: "México", aliases: ["mexico"] },
  { slug: "belgica", name: "Bélgica", aliases: ["belgica"] },
  { slug: "alemania", name: "Alemania", aliases: ["alemania"] },
  { slug: "inglaterra", name: "Inglaterra", aliases: ["inglaterra"] },
  { slug: "estados-unidos", name: "Estados Unidos", aliases: ["usa", "eua", "ee uu", "eeuu", "estados unidos"] },
  { slug: "italia", name: "Italia", aliases: ["italia"] },
  { slug: "espana", name: "España", aliases: ["espana"] },
  { slug: "lituania", name: "Lituania", aliases: ["lituania"] },
  { slug: "irlanda", name: "Irlanda", aliases: ["irlanda"] },
  { slug: "republica-checa", name: "República Checa", aliases: ["rep checa", "republica checa", "chequia"] },
  { slug: "polonia", name: "Polonia", aliases: ["polonia"] },
  { slug: "francia", name: "Francia", aliases: ["francia"] },
];

export const STYLE_CATEGORIES: StyleCategory[] = [
  { slug: "stout", name: "Stout", heading: "Cerveza tipo Stout", match: /\bstout\b/ },
  {
    slug: "ipa",
    name: "IPA",
    heading: "Cerveza tipo IPA",
    match: /\b(ipa|dipa|neipa|india pale ale)\b/,
  },
  { slug: "lager", name: "Lager", heading: "Cerveza tipo Lager", match: /\blager\b/ },
  { slug: "pilsner", name: "Pilsner", heading: "Cerveza tipo Pilsner", match: /\b(pilsner|pils|pilsener)\b/ },
  { slug: "porter", name: "Porter", heading: "Cerveza tipo Porter", match: /\bporter\b/ },
  {
    slug: "trigo",
    name: "Trigo",
    heading: "Cerveza de trigo",
    match: /\b(hefeweizen|hefe|weissbier|weizenbock|dunkelweizen|witbier|blanche|wheat)\b/,
  },
  {
    slug: "pale-ale",
    name: "Pale Ale",
    heading: "Cerveza tipo Pale Ale",
    match: /\bpale ale\b/,
    exclude: /\b(ipa|dipa|neipa|india pale ale)\b/,
  },
  {
    slug: "belga",
    name: "Estilos belgas",
    heading: "Cerveza de estilo belga",
    match: /\b(belgian|tripel|quadrupel|dubbel)\b/,
  },
  { slug: "bock", name: "Bock", heading: "Cerveza tipo Bock", match: /\b(bock|doppelbock|bockbier)\b/ },
  {
    slug: "lambic-y-sour",
    name: "Lambic y Sour",
    heading: "Cerveza Lambic y Sour",
    match: /\b(lambic|sour|gose|gueuze|kriek|berliner)\b/,
  },
  { slug: "frutales", name: "Frutales", heading: "Cerveza de frutas", match: /\bfruit\b/ },
  {
    slug: "sin-alcohol",
    name: "Sin alcohol",
    heading: "Cerveza sin alcohol",
    match: /\b(sin alcohol|alcohol free|alcohol frei|alkoholfrei)\b/,
  },
];

export const getCountryCategory = (slug: string) => COUNTRY_CATEGORIES.find((c) => c.slug === slug);
export const getStyleCategory = (slug: string) => STYLE_CATEGORIES.find((c) => c.slug === slug);

export function productsInCountry(products: Product[], category: CountryCategory): Product[] {
  return products.filter((p) => category.aliases.includes(normalize(p.country)));
}

export function countryCategoryOf(product: Pick<Product, "country">): CountryCategory | undefined {
  const country = normalize(product.country);
  return COUNTRY_CATEGORIES.find((c) => c.aliases.includes(country));
}

export function productsInStyle(products: Product[], category: StyleCategory): Product[] {
  return products.filter((p) => {
    const style = normalize(p.style);
    return category.match.test(style) && !category.exclude?.test(style);
  });
}
