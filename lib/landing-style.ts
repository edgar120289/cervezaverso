import { z } from "zod";

export const TITLE_SIZES = ["s", "m", "l", "xl", "xxl"] as const;
export const SUBTITLE_SIZES = ["s", "m", "l"] as const;
export const ALIGNS = ["left", "center", "right"] as const;
export const LAYOUTS = ["background", "split"] as const;
export const BUTTON_VARIANTS = ["solid", "pill", "outline", "link"] as const;
export const OVERLAYS = [0, 25, 50, 75, 100] as const;
export const SPOTLIGHT_BADGE_MAX = 40;
export const SPOTLIGHT_REF_MAX = 60;

export type TitleSize = (typeof TITLE_SIZES)[number];
export type SubtitleSize = (typeof SUBTITLE_SIZES)[number];
export type Align = (typeof ALIGNS)[number];
export type Layout = (typeof LAYOUTS)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type Overlay = (typeof OVERLAYS)[number];

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser un HEX de 6 dígitos, por ejemplo #5433EB.")
  .nullable();

/** Referencia a un producto: SKU o UUID. Solo letras, números, punto, guion y guion bajo (va a un filtro de PostgREST). */
const productRef = z
  .string()
  .trim()
  .max(SPOTLIGHT_REF_MAX, `El SKU o ID admite ${SPOTLIGHT_REF_MAX} caracteres.`)
  .regex(/^[A-Za-z0-9._-]*$/, "El SKU o ID solo admite letras, números, punto, guion y guion bajo.");

const spotlightSchema = z.object({
  enabled: z.boolean().default(false),
  sku: productRef.default(""),
  badge: z.string().trim().max(SPOTLIGHT_BADGE_MAX, `La etiqueta admite ${SPOTLIGHT_BADGE_MAX} caracteres.`).default(""),
});

export type Spotlight = z.infer<typeof spotlightSchema>;

export type BlockStyle = {
  title_size: TitleSize;
  /** `null` = color automático según el fondo. */
  title_color: string | null;
  subtitle_size: SubtitleSize;
  subtitle_color: string | null;
  align: Align;
  layout: Layout;
  button_variant: ButtonVariant;
  button_bg: string | null;
  button_text: string | null;
  /** Opacidad de la capa oscura sobre la imagen o el video, en %. */
  overlay: Overlay;
  spotlight: Spotlight;
};

const overlaySchema = z.union([z.literal(0), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]);

/** Esquema de estilo con los valores por defecto propios de cada bloque; todo lo ya guardado sin `style` sigue leyéndose. */
function styleSchema(defaults: BlockStyle) {
  return z
    .object({
      title_size: z.enum(TITLE_SIZES).default(defaults.title_size),
      title_color: hexColor.default(defaults.title_color),
      subtitle_size: z.enum(SUBTITLE_SIZES).default(defaults.subtitle_size),
      subtitle_color: hexColor.default(defaults.subtitle_color),
      align: z.enum(ALIGNS).default(defaults.align),
      layout: z.enum(LAYOUTS).default(defaults.layout),
      button_variant: z.enum(BUTTON_VARIANTS).default(defaults.button_variant),
      button_bg: hexColor.default(defaults.button_bg),
      button_text: hexColor.default(defaults.button_text),
      overlay: overlaySchema.default(defaults.overlay),
      spotlight: spotlightSchema.default(defaults.spotlight),
    })
    .default(defaults);
}

const BASE_STYLE: BlockStyle = {
  title_size: "l",
  title_color: null,
  subtitle_size: "m",
  subtitle_color: null,
  align: "center",
  layout: "background",
  button_variant: "pill",
  button_bg: null,
  button_text: null,
  overlay: 50,
  spotlight: { enabled: false, sku: "", badge: "" },
};

export const DEFAULT_HERO_STYLE: BlockStyle = { ...BASE_STYLE, title_size: "xl" };
export const DEFAULT_SPLIT_STYLE: BlockStyle = { ...BASE_STYLE, title_size: "m", align: "left" };
export const DEFAULT_IMPACT_STYLE: BlockStyle = { ...BASE_STYLE, title_size: "m" };
export const DEFAULT_GRID_STYLE: BlockStyle = { ...BASE_STYLE, title_size: "m", align: "left" };

export const heroStyleSchema = styleSchema(DEFAULT_HERO_STYLE);
export const splitStyleSchema = styleSchema(DEFAULT_SPLIT_STYLE);
export const impactStyleSchema = styleSchema(DEFAULT_IMPACT_STYLE);
export const gridStyleSchema = styleSchema(DEFAULT_GRID_STYLE);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProductId(ref: string): boolean {
  return UUID.test(ref);
}

/** Texto negro o blanco, el que más contraste dé sobre el fondo HEX indicado. */
export function readableTextOn(hex: string): "#000000" | "#ffffff" {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

/** Referencias de producto destacado activas en un estilo, sin vacías. */
export function spotlightRef(style: BlockStyle): string | null {
  return style.spotlight.enabled && style.spotlight.sku.trim() ? style.spotlight.sku.trim() : null;
}
