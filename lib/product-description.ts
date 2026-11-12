import type { Product } from "@/lib/types";
import { normalCase } from "@/lib/text-case";

const isMead = (p: Pick<Product, "style" | "name">) => /mead|hidromiel/i.test(`${p.style} ${p.name}`);

/**
 * Frase con los datos duros de la ficha (nombre, estilo, cervecería, país, ABV y presentación).
 * Solo usa lo que existe en la base: nunca inventa un dato que falte.
 */
export function productFactsSentence(p: Product): string {
  const name = normalCase(p.name);
  const style = normalCase(p.style ?? "");
  const brewery = normalCase((p.brewery ?? "").split("/")[0].trim());
  const country = normalCase(p.country ?? "");
  const kind = isMead(p) ? "hidromiel" : "cerveza";

  const origin = [brewery && `de ${brewery}`, country && `de ${country}`].filter(Boolean).join(", ");
  const details = [
    p.abv > 0 && `${p.abv}% de alcohol (ABV)`,
    p.volume_ml > 0 && `presentación de ${p.volume_ml} ml`,
  ].filter(Boolean);

  const head = `${name} es ${kind === "cerveza" ? "una cerveza" : "una hidromiel"}${style ? ` estilo ${style}` : ""}${origin ? ` ${origin}` : ""}`;
  return `${head}${details.length ? `, con ${details.join(" y ")}` : ""}.`;
}

/**
 * Descripción para JSON-LD y feed de Merchant Center. No se muestra en la ficha pública.
 * Datos de la ficha + gancho y perfil de cata + maridaje (si existen) + aviso de venta a mayores de edad.
 */
export function productSeoDescription(p: Product): string {
  const clean = (t: string | null | undefined) => t?.trim().replace(/[.\s]+$/, "") ?? "";
  const hook = clean(p.description_ai);
  const profile = clean(p.notas_perfil);
  const pairing = clean(p.notas_maridaje) || clean(p.pairing_ai);

  const parts = [productFactsSentence(p)];
  if (hook) parts.push(`${hook}.`);
  if (profile && profile !== hook) parts.push(`${profile}.`);
  if (pairing) parts.push(`Maridaje: ${pairing}.`);
  parts.push("Disponible en Cervezaverso, tienda en línea de cerveza artesanal nacional e importada. Venta solo a mayores de 18 años.");
  return parts.join(" ");
}
