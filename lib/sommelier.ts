import type { Product } from "@/lib/types";
import { filterableAbv, normalize } from "@/lib/catalog-filters";
import { FLAVORS, INTENSITIES, OCCASIONS, type QuizAnswers } from "@/lib/data/sommelier-quiz";

export type Recommendation = { product: Product; reasons: string[] };

/** Paquetes con copa o varios estilos: no son "una cerveza" que recomendar. */
const BUNDLE = /\b(paquete|pack|kit)\b|\bvarios estilos\b|\bdiferentes? estilos\b|\b\d+ estilos\b|\bdos estilos\b|\bmas (vaso|copa)/;

const WEIGHTS = { flavor: 3, occasion: 2, abv: 2 } as const;

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * Puntúa cada cerveza disponible con las respuestas del quiz y devuelve las
 * mejores de estilos distintos. Sabor pesa más que ocasión; la intensidad se
 * mide con el ABV real (con penalización gradual si queda fuera del rango).
 */
export function recommend(products: Product[], answers: QuizAnswers, limit = 3, random = Math.random): Recommendation[] {
  const flavor = FLAVORS.find((f) => f.id === answers.flavor)!;
  const occasion = OCCASIONS.find((o) => o.id === answers.occasion)!;
  const intensity = INTENSITIES.find((i) => i.id === answers.intensity)!;
  const [minAbv, maxAbv] = intensity.abv;

  const scored = products
    .filter((product) => product.stock_status !== "out_of_stock")
    .filter((product) => !BUNDLE.test(normalize(`${product.name} ${product.style}`)))
    .map((product) => {
      const style = normalize(product.style);
      const abv = filterableAbv(product);
      const reasons: string[] = [];
      let score = 0;

      if (answers.intensity === "sin") {
        // Sin alcohol es un requisito, no una preferencia.
        if (abv === null || abv >= maxAbv) return null;
        reasons.push(intensity.reason);
      } else if (abv !== null && abv > 0) {
        if (abv >= minAbv && abv < maxAbv) {
          score += WEIGHTS.abv;
          reasons.push(`${intensity.reason} · ${abv}%`);
        } else {
          const distance = abv < minAbv ? minAbv - abv : abv - maxAbv;
          score -= Math.min(WEIGHTS.abv, distance / 2);
        }
      } else {
        return null; // ABV desconocido o sin alcohol cuando se pidió con alcohol.
      }

      if (matchesAny(style, flavor.keywords)) {
        score += WEIGHTS.flavor;
        reasons.unshift(flavor.reason);
      }
      if (occasion.keywords.length > 0 && matchesAny(style, occasion.keywords)) {
        score += WEIGHTS.occasion;
        reasons.push(occasion.reason);
      }
      if (product.stock_status === "in_stock") score += 0.25;

      // Desempate aleatorio: repetir el quiz no siempre da las mismas tres.
      return { product, reasons, score: score + random() * 0.5, style };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => b.score - a.score);

  // Tres estilos distintos para que la recomendación sea variada.
  const picked: typeof scored = [];
  const styles = new Set<string>();
  for (const entry of scored) {
    if (styles.has(entry.style)) continue;
    picked.push(entry);
    styles.add(entry.style);
    if (picked.length === limit) break;
  }
  // Si no hay suficientes estilos distintos, se completa con los siguientes mejores.
  for (const entry of scored) {
    if (picked.length === limit) break;
    if (!picked.includes(entry)) picked.push(entry);
  }

  return picked.map(({ product, reasons }) => ({ product, reasons }));
}
