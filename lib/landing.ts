import { z } from "zod";
import { DEFAULT_HERO_SETTINGS, heroSettingsSchema } from "@/lib/hero";

export const LANDING_MODULES = [
  { id: "split", label: "Layout dividido", description: "Texto a un lado e imagen al otro." },
  { id: "impact", label: "Banner de impacto", description: "Franja a todo el ancho con un mensaje principal." },
  { id: "grid", label: "Cuadrícula", description: "Productos o categorías en una rejilla." },
] as const;

export const MODULE_TITLE_MAX = 120;

export type LandingModuleId = (typeof LANDING_MODULES)[number]["id"];

const moduleSchema = z.object({
  id: z.enum(["split", "impact", "grid"]),
  enabled: z.boolean(),
  title: z.string().trim().max(MODULE_TITLE_MAX, `El título admite ${MODULE_TITLE_MAX} caracteres.`),
  order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

/** Los 3 bloques, uno por tipo, con un orden distinto cada uno. */
const modulesSchema = z
  .array(moduleSchema)
  .length(3, "Deben ser 3 bloques.")
  .refine((modules) => new Set(modules.map((m) => m.id)).size === 3, "Cada bloque debe ser de un tipo distinto.")
  .refine((modules) => new Set(modules.map((m) => m.order)).size === 3, "Dos bloques no pueden tener el mismo orden (1, 2 y 3).");

export const landingSettingsSchema = z.object({
  hero: heroSettingsSchema,
  modules: modulesSchema,
});

export type LandingModule = z.infer<typeof moduleSchema>;
export type LandingSettings = z.infer<typeof landingSettingsSchema>;

export const DEFAULT_LANDING_MODULES: LandingModule[] = LANDING_MODULES.map((module, index) => ({
  id: module.id,
  enabled: false,
  title: "",
  order: (index + 1) as 1 | 2 | 3,
}));

export const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  hero: DEFAULT_HERO_SETTINGS,
  modules: DEFAULT_LANDING_MODULES,
};

/**
 * Lee `landing_settings`; cada parte ilegible o ausente cae a su valor por defecto.
 * `legacyHero` son las columnas hero_* de antes de la migración 010: se usan hasta el primer guardado.
 */
export function parseLandingSettings(raw: unknown, legacyHero: z.infer<typeof heroSettingsSchema>): LandingSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const hero = heroSettingsSchema.safeParse(source.hero);
  const modules = modulesSchema.safeParse(source.modules);

  return {
    hero: hero.success ? hero.data : legacyHero,
    modules: modules.success ? modules.data : DEFAULT_LANDING_MODULES,
  };
}
