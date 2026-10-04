import { z } from "zod";
import { ctaListSchema, DEFAULT_HERO_SETTINGS, heroSettingsSchema } from "@/lib/hero";

export const LANDING_MODULES = [
  { id: "split", label: "Layout dividido", description: "Imagen a un lado y texto con botones al otro." },
  { id: "impact", label: "Banner de impacto", description: "Franja a todo el ancho con imagen de fondo y un mensaje principal." },
  { id: "grid", label: "Cuadrícula", description: "Lista de ventajas o datos, cada uno con ícono, título y texto." },
] as const;

export const MODULE_TITLE_MAX = 120;
export const MODULE_BODY_MAX = 800;
export const MODULE_SUBTITLE_MAX = 240;
export const MAX_SPLIT_CTAS = 2;
export const MAX_IMPACT_CTAS = 1;
export const MAX_GRID_ITEMS = 8;
export const GRID_ITEM_TITLE_MAX = 40;
export const GRID_ITEM_TEXT_MAX = 140;

/** Íconos de lucide-react disponibles para la cuadrícula (el mapa a componentes vive en components/landing/icons.ts). */
export const GRID_ICON_NAMES = [
  "Beer",
  "Truck",
  "ShieldCheck",
  "Gift",
  "Star",
  "Heart",
  "MapPin",
  "Clock",
  "Award",
  "Leaf",
  "Wheat",
  "Package",
  "Sparkles",
  "Wallet",
  "MessageCircle",
  "ThumbsUp",
] as const;

export type GridIconName = (typeof GRID_ICON_NAMES)[number];

export type LandingModuleId = (typeof LANDING_MODULES)[number]["id"];

const imageUrl = z.url({ protocol: /^https?$/ }).nullable();

const base = {
  enabled: z.boolean(),
  title: z.string().trim().max(MODULE_TITLE_MAX, `El título admite ${MODULE_TITLE_MAX} caracteres.`),
  order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
};

const gridItemSchema = z.object({
  icon: z.enum(GRID_ICON_NAMES),
  /** Ícono subido: si existe, sustituye al de lucide. */
  icon_image_url: imageUrl,
  title: z.string().trim().min(1, "Cada elemento de la cuadrícula necesita un título.").max(GRID_ITEM_TITLE_MAX, `El título del elemento admite ${GRID_ITEM_TITLE_MAX} caracteres.`),
  text: z.string().trim().max(GRID_ITEM_TEXT_MAX, `El texto del elemento admite ${GRID_ITEM_TEXT_MAX} caracteres.`),
});

const splitSchema = z.object({
  ...base,
  id: z.literal("split"),
  body: z.string().trim().max(MODULE_BODY_MAX, `El párrafo admite ${MODULE_BODY_MAX} caracteres.`).default(""),
  image_url: imageUrl.default(null),
  image_alt: z.string().trim().max(200, "La descripción de la imagen admite 200 caracteres.").default(""),
  image_position: z.enum(["left", "right"]).default("right"),
  ctas: ctaListSchema(MAX_SPLIT_CTAS).default([]),
});

const impactSchema = z.object({
  ...base,
  id: z.literal("impact"),
  subtitle: z.string().trim().max(MODULE_SUBTITLE_MAX, `El subtítulo admite ${MODULE_SUBTITLE_MAX} caracteres.`).default(""),
  image_url: imageUrl.default(null),
  image_alt: z.string().trim().max(200, "La descripción de la imagen admite 200 caracteres.").default(""),
  darken: z.boolean().default(true),
  ctas: ctaListSchema(MAX_IMPACT_CTAS).default([]),
});

const gridSchema = z.object({
  ...base,
  id: z.literal("grid"),
  items: z.array(gridItemSchema).max(MAX_GRID_ITEMS, `Máximo ${MAX_GRID_ITEMS} elementos.`).default([]),
});

const moduleSchema = z.discriminatedUnion("id", [splitSchema, impactSchema, gridSchema]);

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
export type SplitModule = z.infer<typeof splitSchema>;
export type ImpactModule = z.infer<typeof impactSchema>;
export type GridModule = z.infer<typeof gridSchema>;
export type GridItem = z.infer<typeof gridItemSchema>;
export type LandingSettings = z.infer<typeof landingSettingsSchema>;

export const DEFAULT_LANDING_MODULES: LandingModule[] = [
  { id: "split", enabled: false, title: "", order: 1, body: "", image_url: null, image_alt: "", image_position: "right", ctas: [] },
  { id: "impact", enabled: false, title: "", order: 2, subtitle: "", image_url: null, image_alt: "", darken: true, ctas: [] },
  { id: "grid", enabled: false, title: "", order: 3, items: [] },
];

export const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  hero: DEFAULT_HERO_SETTINGS,
  modules: DEFAULT_LANDING_MODULES,
};

/** Todas las imágenes que la configuración tiene en uso (Hero y bloques), para limpiar el bucket. */
export function collectImageUrls(settings: LandingSettings): string[] {
  const urls = settings.hero.hero_banners.map((banner) => banner.image_url);
  for (const block of settings.modules) {
    if (block.id === "grid") {
      for (const item of block.items) if (item.icon_image_url) urls.push(item.icon_image_url);
    } else if (block.image_url) {
      urls.push(block.image_url);
    }
  }
  return urls;
}

/**
 * Lee `landing_settings`; cada parte ilegible o ausente cae a su valor por defecto.
 */
export function parseLandingSettings(raw: unknown): LandingSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const hero = heroSettingsSchema.safeParse(source.hero);
  const modules = modulesSchema.safeParse(source.modules);

  return {
    hero: hero.success ? hero.data : DEFAULT_HERO_SETTINGS,
    modules: modules.success ? modules.data : DEFAULT_LANDING_MODULES,
  };
}
