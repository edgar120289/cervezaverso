/**
 * Quiz del Sommelier para clientes: 3 preguntas. Las `keywords` se buscan
 * (sin acentos ni mayúsculas) dentro del estilo de cada cerveza, así que están
 * calibradas con los estilos reales de la lista del proveedor.
 */

export type FlavorId = "ligera" | "lupulada" | "tostada" | "frutal" | "belga";
export type OccasionId = "tacos" | "carnes" | "mariscos" | "postres" | "sola";
export type IntensityId = "suave" | "media" | "intensa" | "sin";

export type QuizAnswers = { flavor: FlavorId; occasion: OccasionId; intensity: IntensityId };

type Option<Id extends string> = {
  id: Id;
  label: string;
  hint: string;
  emoji: string;
  /** Texto corto para explicar la recomendación ("Ligera y refrescante"). */
  reason: string;
  keywords: string[];
};

export type IntensityOption = Omit<Option<IntensityId>, "keywords"> & {
  /** Rango de ABV ideal [min, max). `sin` exige cerveza sin alcohol. */
  abv: [number, number];
};

export const FLAVORS: Option<FlavorId>[] = [
  {
    id: "ligera",
    label: "Ligera y refrescante",
    hint: "Lager, pilsner, trigo",
    emoji: "🌾",
    reason: "Ligera y refrescante",
    keywords: [
      "lager", "pils", "helles", "kolsch", "blond", "wheat", "weiz", "weiss", "witbier", "white",
      "session", "light", "vienna", "rice", "summer", "golden", "dortmunder", "svetly", "seltzer",
    ],
  },
  {
    id: "lupulada",
    label: "Cítrica y lupulada",
    hint: "IPA, pale ale, hazy",
    emoji: "🍊",
    reason: "Cítrica y lupulada",
    keywords: [
      "ipa", "india pale", "pale ale", "hazy", "neipa", "dipa", "hop", "ddh", "west coast", "foggy",
      "bitter", "citra",
    ],
  },
  {
    id: "tostada",
    label: "Tostada y profunda",
    hint: "Café, chocolate, caramelo",
    emoji: "☕",
    reason: "Notas tostadas",
    keywords: [
      "stout", "porter", "dunkel", "bock", "schwarz", "dark", "brown", "coffee", "cafe",
      "scotch", "scottish", "marzen", "oktoberfest", "red", "altbier", "tmawy", "barley wine",
      "rotbier", "mole",
    ],
  },
  {
    id: "frutal",
    label: "Frutal o ácida",
    hint: "Lambic, sour, frutas",
    emoji: "🍒",
    reason: "Frutal y vibrante",
    keywords: [
      "fruit", "frut", "lambic", "kriek", "sour", "gose", "berliner", "cherry", "cereza", "frambuesa",
      "mango", "smoothie", "watermelon", "toronja", "grapefruit", "hidromiel", "mead", "berry",
    ],
  },
  {
    id: "belga",
    label: "Compleja y especiada",
    hint: "Estilo belga, abadía",
    emoji: "🏰",
    reason: "Compleja, estilo belga",
    keywords: [
      "tripel", "dubbel", "quad", "belgian", "abbey", "saison", "strong ale", "winter", "christmas",
      "spiced", "barrel", "barrica",
    ],
  },
];

export const OCCASIONS: Option<OccasionId>[] = [
  {
    id: "tacos",
    label: "Tacos y antojitos",
    hint: "Botana, tacos al pastor",
    emoji: "🌮",
    reason: "Ideal con tacos",
    keywords: ["lager", "pils", "mexican", "vienna", "ipa", "pale ale", "wheat", "limon", "blond"],
  },
  {
    id: "carnes",
    label: "Carne asada y parrilla",
    hint: "Cortes, hamburguesas, BBQ",
    emoji: "🔥",
    reason: "Perfecta para la parrilla",
    keywords: ["stout", "porter", "ipa", "bock", "dunkel", "red", "brown", "dubbel", "scotch", "marzen", "altbier"],
  },
  {
    id: "mariscos",
    label: "Mariscos y ensaladas",
    hint: "Ceviche, aguachile, pescado",
    emoji: "🦐",
    reason: "Va con mariscos",
    keywords: ["wheat", "weiz", "weiss", "wit", "white", "pils", "helles", "kolsch", "saison", "sour", "gose", "session", "blond"],
  },
  {
    id: "postres",
    label: "Postres y chocolate",
    hint: "Pasteles, fruta, quesos",
    emoji: "🍫",
    reason: "Para el postre",
    keywords: ["stout", "porter", "fruit", "kriek", "lambic", "quad", "barley wine", "pastry", "chocolate", "cacao", "sweet", "milk", "smoothie"],
  },
  {
    id: "sola",
    label: "Sola, para platicar",
    hint: "Sin comida de por medio",
    emoji: "🍻",
    reason: "Para disfrutar sola",
    keywords: [],
  },
];

export const INTENSITIES: IntensityOption[] = [
  { id: "suave", label: "Suave", hint: "Hasta 5.5% · para varias rondas", emoji: "🌤️", reason: "Suave", abv: [0.5, 5.5] },
  { id: "media", label: "Media", hint: "5 a 7.5% · con carácter", emoji: "⚖️", reason: "Intensidad media", abv: [5, 7.5] },
  { id: "intensa", label: "Intensa", hint: "Más de 7% · para saborear despacio", emoji: "🌋", reason: "Intensa", abv: [7, Infinity] },
  { id: "sin", label: "Sin alcohol", hint: "Todo el sabor, 0.0%", emoji: "💧", reason: "Sin alcohol", abv: [0, 1] },
];

export const QUIZ_STEPS = [
  { key: "flavor", question: "¿Qué perfil de sabor buscas?", options: FLAVORS },
  { key: "occasion", question: "¿Para qué ocasión o comida?", options: OCCASIONS },
  { key: "intensity", question: "¿Qué tan intensa la prefieres?", options: INTENSITIES },
] as const;
