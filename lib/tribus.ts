export const TRIBUS = [
  { id: "ipa", label: "Team IPA", note: "Lúpulo intenso y amargor con carácter." },
  { id: "stout", label: "Team Stout", note: "Tostados, café y cacao." },
  { id: "sour", label: "Team Sour", note: "Ácidas, frutales y refrescantes." },
  { id: "lager", label: "Team Lager", note: "Limpias, ligeras y fáciles de beber." },
  { id: "trigo", label: "Team Trigo", note: "Suaves, cremosas y especiadas." },
  { id: "ale", label: "Team Ale", note: "Maltosas y equilibradas." },
  { id: "porter", label: "Team Porter", note: "Tostadas y suaves, con chocolate y caramelo." },
  { id: "barleywine", label: "Team Barleywine", note: "Intensas y licorosas, para saborear despacio." },
  { id: "lambic", label: "Team Lambic", note: "Fermentación espontánea, ácidas y complejas." },
  { id: "bitter", label: "Team Bitter", note: "Malta y amargor sereno, estilo pub inglés." },
  { id: "weissbier", label: "Team Weissbier", note: "Trigo alemán con notas de plátano y clavo." },
  { id: "bock", label: "Team Bock", note: "Lager alemana de malta, robusta y tostada." },
] as const;

export type TribuId = (typeof TRIBUS)[number]["id"];

export const TRIBU_IDS = TRIBUS.map((t) => t.id) as [TribuId, ...TribuId[]];

export function toTribuId(value: unknown): TribuId | null {
  return TRIBU_IDS.find((id) => id === value) ?? null;
}

export function tribuLabel(id: string | null): string {
  return TRIBUS.find((t) => t.id === id)?.label ?? "Sin team";
}
