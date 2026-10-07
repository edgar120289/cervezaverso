/** Niveles de recompensa por botellas acumuladas. Los valores deben coincidir con `acreditar_botellas` (012). */
export const NIVELES_RECOMPENSA = [
  { botellas: 20, premio: "Cerveza Sorpresa" },
  { botellas: 40, premio: "Cristalería Gratis" },
  { botellas: 60, premio: "Playera + 10% Extra" },
] as const;

export type Progreso = {
  total: number;
  /** Siguiente nivel por alcanzar; null si ya superó todos. */
  siguiente: { botellas: number; premio: string } | null;
  faltan: number;
  /** Avance de 0 a 100 hacia el siguiente nivel, contado desde el nivel anterior. */
  porcentaje: number;
};

export function calcularProgreso(total: number): Progreso {
  const siguiente = NIVELES_RECOMPENSA.find((n) => total < n.botellas) ?? null;
  if (!siguiente) return { total, siguiente: null, faltan: 0, porcentaje: 100 };
  const anterior = [...NIVELES_RECOMPENSA].reverse().find((n) => n.botellas <= total)?.botellas ?? 0;
  const porcentaje = Math.round(((total - anterior) / (siguiente.botellas - anterior)) * 100);
  return { total, siguiente, faltan: siguiente.botellas - total, porcentaje };
}
