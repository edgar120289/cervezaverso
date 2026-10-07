export const TRIBUS = [
  { id: "ipa", label: "Team IPA", note: "Lúpulo intenso y amargor con carácter." },
  { id: "stout", label: "Team Stout", note: "Tostados, café y cacao." },
  { id: "sour", label: "Team Sour", note: "Ácidas, frutales y refrescantes." },
  { id: "lager", label: "Team Lager", note: "Limpias, ligeras y fáciles de beber." },
  { id: "trigo", label: "Team Trigo", note: "Suaves, cremosas y especiadas." },
  { id: "ale", label: "Team Ale", note: "Maltosas y equilibradas." },
] as const;

export type TribuId = (typeof TRIBUS)[number]["id"];

export const TRIBU_IDS = TRIBUS.map((t) => t.id) as [TribuId, ...TribuId[]];

export function toTribuId(value: unknown): TribuId | null {
  return TRIBU_IDS.find((id) => id === value) ?? null;
}

export function tribuLabel(id: string | null): string {
  return TRIBUS.find((t) => t.id === id)?.label ?? "Sin tribu";
}
