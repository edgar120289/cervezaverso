import type { Product } from "@/lib/types";

/** Descripción para JSON-LD y feed: gancho + perfil de cata del Sommelier; respaldo con datos básicos. */
export function productSeoDescription(p: Product): string {
  const hook = p.description_ai?.trim().replace(/[.\s]+$/, "");
  const profile = p.notas_perfil?.trim();
  if (hook && profile) return `${hook}. ${profile}`;
  return hook || profile || `${p.style} de ${p.country}, ${p.abv}% ABV, ${p.volume_ml} ml.`;
}
