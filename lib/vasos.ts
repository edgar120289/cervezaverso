/**
 * Vasos: catálogo de tipos de vaso y regla que asigna a cada cerveza el vaso en que se sirve.
 * Sirve de base para generar después las fotos de la cerveza servida (Fase 0 del plan de fotos).
 * Sin dependencias de servidor: lo usan el panel, las Server Actions y los scripts.
 */

export const VASO_CODES = [
  "sin_servida",
  "highball",
  "copa_vino",
  "flauta_champana",
  "teku",
  "weizen",
  "vaso_hexagonal_wit",
  "flauta_lambic",
  "caliz",
  "tulipa",
  "snifter",
  "copa_cardo",
  "pinta_tulipa_irlandesa",
  "tulipa_chica",
  "copa_pilsner",
  "tarro_checo",
  "tarro_aleman",
  "becher_cilindrico",
  "copa_ipa",
  "pinta_americana",
  "pinta_nonic",
  "willi_becher",
] as const;

export type VasoCode = (typeof VASO_CODES)[number];
export type VasoOrigen = "auto" | "manual";

export type VasoInfo = {
  /** Nombre en español para el panel. */
  nombre: string;
  /** Descripción visual en inglés para prompts de imagen. Sin marcas ni logotipos. */
  prompt: string;
};

export const VASOS: Record<VasoCode, VasoInfo> = {
  sin_servida: {
    nombre: "Sin foto servida",
    prompt:
      "no poured glass: product shot of the sealed package only (gift pack, multi-bottle box, cans or keg), nothing served, no branding added",
  },
  highball: {
    nombre: "Vaso highball",
    prompt:
      "tall slim straight-sided highball glass, thin clear walls, flat heavy base, filled with a pale sparkling drink over ice, fine bubbles, no foam head, plain unbranded glass",
  },
  copa_vino: {
    nombre: "Copa de vino",
    prompt:
      "classic stemmed white wine glass, rounded bowl tapering slightly inward at the rim, long thin stem, round flat foot, filled one third, still liquid with no foam, plain unbranded glass",
  },
  flauta_champana: {
    nombre: "Flauta de champaña",
    prompt:
      "tall narrow champagne flute, slender elongated bowl, long thin stem, round foot, fine streams of rising bubbles, thin delicate white mousse on top, plain unbranded glass",
  },
  teku: {
    nombre: "Copa Teku",
    prompt:
      "Teku stemmed craft beer glass, angular bowl with a sharp widest point low on the bowl, walls tapering inward and then flaring into a thin outward lip, long thin stem, round foot, dense creamy foam, plain unbranded glass",
  },
  weizen: {
    nombre: "Vaso weizen",
    prompt:
      "tall curved German wheat beer glass, narrow at the bottom, wider and rounded near the top, thin walls, half-litre size, thick tall fluffy white foam head rising above the rim, plain unbranded glass",
  },
  vaso_hexagonal_wit: {
    nombre: "Vaso hexagonal (witbier)",
    prompt:
      "short chunky Belgian witbier tumbler with thick faceted hexagonal sides, heavy solid base, wide straight mouth, hazy pale beer, dense white foam cap, plain unbranded glass",
  },
  flauta_lambic: {
    nombre: "Flauta de lambic",
    prompt:
      "tall slender Belgian lambic flute tumbler, narrow straight sides flaring very slightly toward the rim, short thick solid base, no stem, lively fine bubbles, thin pinkish-white foam, plain unbranded glass",
  },
  caliz: {
    nombre: "Cáliz trapense",
    prompt:
      "Trappist chalice goblet, wide shallow bowl with thick sturdy walls, wide open mouth, short thick stem, heavy round foot, dense creamy off-white foam, plain unbranded glass with no gold rim or engraving",
  },
  tulipa: {
    nombre: "Copa tulipa",
    prompt:
      "Belgian tulip beer glass, bulbous rounded bowl that narrows at the neck and flares outward at the lip, short stem, round foot, towering rocky white foam head, plain unbranded glass",
  },
  snifter: {
    nombre: "Snifter (copa balón)",
    prompt:
      "snifter balloon glass, wide round bowl narrowing markedly toward the rim, very short stem, round foot, filled only one third with dark beer, thin tan foam ring, plain unbranded glass",
  },
  copa_cardo: {
    nombre: "Copa cardo (thistle)",
    prompt:
      "Scottish thistle glass, round bulbous lower bowl sitting on a short stem, tall walls flaring outward like a thistle flower above the bulb, round foot, deep amber beer, creamy beige foam, plain unbranded glass",
  },
  pinta_tulipa_irlandesa: {
    nombre: "Pinta tulipa irlandesa",
    prompt:
      "Irish tulip pint glass, tall, narrow at the base, gently bulging outward in the upper third and curving slightly back in at the rim, no stem, black stout with a thick smooth creamy tan head sitting level with the rim, plain unbranded glass",
  },
  tulipa_chica: {
    nombre: "Tulipa chica (pokal)",
    prompt:
      "small stemmed pokal tulip glass, compact bowl that tapers gently toward the rim, short sturdy stem, round foot, about 300 ml, firm two-finger foam head, plain unbranded glass",
  },
  copa_pilsner: {
    nombre: "Copa pilsner",
    prompt:
      "tall slender footed pilsner glass, narrow conical bowl tapering down to a short stem, small round foot, brilliant clear golden beer, steady columns of bubbles, tall dense white foam crown, plain unbranded glass",
  },
  tarro_checo: {
    nombre: "Tarro checo",
    prompt:
      "Czech tubinger beer mug, thick heavy glass with long vertical fluted ribs along the body, sturdy side handle, half-litre size, dark lager, thick wet creamy foam filling the top third, plain unbranded glass",
  },
  tarro_aleman: {
    nombre: "Tarro alemán",
    prompt:
      "German dimpled beer mug (seidel), thick heavy glass barrel body covered with round dimples, large sturdy side handle, half-litre size, generous white foam head just above the rim, plain unbranded glass",
  },
  becher_cilindrico: {
    nombre: "Becher cilíndrico (stange)",
    prompt:
      "short straight-sided cylindrical becher glass, perfectly vertical thin walls, flat base, small size about 250 ml, copper-brown beer, compact off-white foam cap, plain unbranded glass",
  },
  copa_ipa: {
    nombre: "Copa IPA",
    prompt:
      "IPA glass, slender ridged hollow base that widens into a tall rounded tulip-shaped bowl, bowl tapering slightly inward at the rim, no stem, thin walls, frothy white foam head, plain unbranded glass",
  },
  pinta_americana: {
    nombre: "Pinta americana (shaker)",
    prompt:
      "American shaker pint glass, simple conical shape, straight sides widening evenly from a narrow thick base to a wide mouth, no stem, one-finger white foam head, plain unbranded glass",
  },
  pinta_nonic: {
    nombre: "Pinta nonic",
    prompt:
      "English nonic pint glass, slightly conical with a distinctive rounded bulge ring about two centimetres below the rim, no stem, thin low creamy foam layer, plain unbranded glass",
  },
  willi_becher: {
    nombre: "Willi becher",
    prompt:
      "Willi becher lager glass, tall and slim, widening gently from the base up to the upper quarter and then tapering slightly inward to the rim, no stem, thin walls, clear golden beer, neat white foam head, plain unbranded glass",
  },
};

export function isVasoCode(value: unknown): value is VasoCode {
  return typeof value === "string" && (VASO_CODES as readonly string[]).includes(value);
}

/** Nombre en español del vaso; «Sin asignar» si no tiene. */
export function vasoNombre(code: string | null | undefined): string {
  return isVasoCode(code) ? VASOS[code].nombre : "Sin asignar";
}

/** MAYÚSCULAS, sin acentos y con espacios simples, para comparar estilos, nombres y países. */
export function normalizeVasoText(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Palabra o frase completa (no parte de otra palabra): «MEAD» no coincide con «MEADOW». */
function word(text: string, ...terms: string[]): boolean {
  return terms.some((term) => new RegExp(`(^|[^A-Z0-9])${term}([^A-Z0-9]|$)`).test(text));
}

/** El texto contiene alguno de los fragmentos (también dentro de otra palabra: «DUNKELWEIZEN»). */
function has(text: string, ...fragments: string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

export type VasoInput = { name: string; style: string; country?: string | null };

/** Formas de decir «sin alcohol» que trae el catálogo (texto ya normalizado). */
const NON_ALCOHOLIC = /ALKOHOLFREI|ALCOHOL ?FRE[EI]|NON-ALCOHOLIC|SIN ALCOHOL|NO ALCOHOLICA|(^|[^0-9.,])0[.,]0([^0-9]|$)/;

type Ctx = {
  /** Nombre normalizado: solo lo usan packs/barriles y las excepciones por marca. */
  name: string;
  style: string;
  /** Nombre y estilo juntos: solo lo usa la regla de packs y barriles. */
  nameOrStyle: string;
  belgian: boolean;
  /** IPA en cualquiera de sus formas: IPA, NEIPA, DIPA o «INDIA PALE ALE». */
  ipa: boolean;
  session: boolean;
};

/** Reglas en orden: la primera que coincide gana. */
const RULES: { vaso: VasoCode; test: (ctx: Ctx) => boolean }[] = [
  // 1. Packs, barriles y surtidos: no se sirven en un vaso.
  {
    vaso: "sin_servida",
    test: ({ nameOrStyle }) =>
      word(nameOrStyle, "BARRIL", "BARRILES", "PACK", "PACKS", "PAQUETE", "PAQUETES", "BOTELLAS", "LATAS", "VARIOS ESTILOS", "DOS ESTILOS"),
  },
  // Excepciones por marca (decididas por el cliente, 2026-11-17), después de packs y barriles:
  // la versión sin alcohol de una cervecería de trigo alemana se sirve en su vaso weizen…
  {
    vaso: "weizen",
    test: ({ name, style }) =>
      word(name, "ERDINGER", "PAULANER", "WEIHENSTEPHANER") && (NON_ALCOHOLIC.test(style) || NON_ALCOHOLIC.test(name)),
  },
  // …y todo Kasteel (también sus frutales) va en el cáliz de la casa.
  { vaso: "caliz", test: ({ name }) => word(name, "KASTEEL") },
  { vaso: "highball", test: ({ style }) => has(style, "HARD SELTZER") },
  { vaso: "copa_vino", test: ({ style }) => has(style, "HIDROMIEL", "BRAGGOT") || word(style, "MEAD") },
  { vaso: "flauta_champana", test: ({ style }) => has(style, "CHAMPAGNE") || word(style, "BRUT") },
  { vaso: "teku", test: ({ style }) => has(style, "SMOOTHIE", "PASTRY SOUR") },
  // 6. Trigo alemán. AMERICAN WHEAT y CITRUS WHEAT no entran aquí: van a la pinta americana (regla 20).
  { vaso: "weizen", test: ({ style }) => has(style, "WEIZEN", "WEISS", "HEFE", "MUNICH WHEAT") },
  { vaso: "vaso_hexagonal_wit", test: ({ style }) => has(style, "WITBIER", "BLANCHE", "BELGIAN WHITE") },
  { vaso: "flauta_lambic", test: ({ style, belgian }) => has(style, "LAMBIC", "KRIEK") || (belgian && has(style, "FRUIT BEER")) },
  {
    vaso: "caliz",
    test: ({ style, ipa }) => has(style, "DUBBEL", "TRIPEL", "QUADRUPEL", "ABBEY") || (word(style, "TRIPLE") && !ipa),
  },
  { vaso: "tulipa", test: ({ style }) => has(style, "BELGIAN STRONG", "BELGIAN BLOND STRONG", "BELGIAN BLONDE STRONG", "BELGIAN DARK") },
  {
    vaso: "snifter",
    test: ({ style }) =>
      has(style, "IMPERIAL STOUT", "RUSSIAN IMPERIAL", "BALTIC PORTER", "BARREL", "PASTRY STOUT", "DOPPELBOCK") ||
      (has(style, "STOUT") && has(style, "IMPERIAL", "DOBLE", "DOUBLE")),
  },
  { vaso: "copa_cardo", test: ({ style }) => has(style, "SCOTCH ALE") },
  { vaso: "pinta_tulipa_irlandesa", test: ({ style }) => has(style, "STOUT") },
  { vaso: "tulipa_chica", test: ({ style }) => has(style, "BOCK") },
  { vaso: "copa_pilsner", test: ({ style }) => has(style, "PILS", "GRODZISKIE") },
  { vaso: "tarro_checo", test: ({ style }) => has(style, "TMAVY", "CZECH DARK") },
  { vaso: "tarro_aleman", test: ({ style }) => has(style, "HELLES", "MARZEN", "OKTOBERFEST", "LANDBIER", "DUNKEL") },
  { vaso: "becher_cilindrico", test: ({ style }) => has(style, "ALTBIER") },
  // 19. Familia IPA, salvo las «session» (regla 20).
  { vaso: "copa_ipa", test: ({ style, ipa, session }) => !session && (ipa || has(style, "HAZY", "DDH", "WEST COAST")) },
  {
    vaso: "pinta_americana",
    test: ({ style, ipa, session }) =>
      (session && (ipa || has(style, "HAZY", "DDH", "WEST COAST"))) ||
      // «ENGLISH PALE ALE» contiene «PALE ALE», pero es de la pinta nonic (regla 21).
      (has(style, "PALE ALE") && !has(style, "ENGLISH PALE")) ||
      has(style, "RED ALE", "AMERICAN WHEAT", "CITRUS WHEAT") ||
      word(style, "AMBER", "BROWN"),
  },
  {
    vaso: "pinta_nonic",
    test: ({ style }) => has(style, "BITTER", "ENGLISH PALE", "ENGLISH STRONG", "PORTER", "WINTER ALE") || word(style, "ESB"),
  },
  {
    vaso: "willi_becher",
    test: ({ style }) =>
      has(style, "LAGER", "MEXICAN", "SCHWARZBIER", "SIN ALCOHOL", "ALKOHOLFREI") ||
      word(style, "LIGHT", "MALTA") ||
      // Otras formas de escribir «sin alcohol» que trae el catálogo.
      has(style, "ALCOHOL FREI", "ALCOHOLFREE", "ALCOHOL FREE", "NON-ALCOHOLIC", "NO ALCOHOLICA"),
  },
  // 23. Lo demás (FRUIT BEER no belga, BLONDE / BLOND ALE y lo que no coincida) queda sin asignar.
];

/**
 * Vaso que le toca a una cerveza según su estilo (y su nombre, para packs y barriles).
 * Devuelve `null` cuando ninguna regla coincide: esas las decide el admin en `/admin/vasos`.
 */
export function assignVaso({ name, style, country }: VasoInput): VasoCode | null {
  const normalizedStyle = normalizeVasoText(style);
  const ctx: Ctx = {
    name: normalizeVasoText(name),
    style: normalizedStyle,
    nameOrStyle: `${normalizeVasoText(name)} | ${normalizedStyle}`,
    belgian: has(normalizeVasoText(country), "BELGICA", "BELGIUM"),
    ipa: /(^|[^A-Z0-9])[A-Z]{0,2}IPA([^A-Z0-9]|$)/.test(normalizedStyle) || normalizedStyle.includes("INDIA PALE ALE"),
    session: word(normalizedStyle, "SESSION"),
  };
  return RULES.find((rule) => rule.test(ctx))?.vaso ?? null;
}
