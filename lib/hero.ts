import { z } from "zod";

/** Debe coincidir con `hero_banners_valid` y los demás checks de la migración 007. */
export const HERO_BUCKET = "hero-banners";
export const MAX_HERO_BANNERS = 10;
export const MAX_HERO_CTAS = 3;
export const HERO_INTERVALS = [3, 5, 7] as const;
export const HERO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_HERO_IMAGE_BYTES = 8 * 1024 * 1024;

export const heroImageSchema = z
  .instanceof(File, { message: "No se eligió ninguna imagen." })
  .refine((file) => HERO_IMAGE_TYPES.includes(file.type), "La imagen debe ser JPG, PNG, WebP o AVIF.")
  .refine((file) => file.size > 0, "La imagen está vacía.")
  .refine((file) => file.size <= MAX_HERO_IMAGE_BYTES, "La imagen supera los 8 MB.");

const EXTERNAL_URL = /^https?:\/\/\S+$/i;
const INTERNAL_URL = /^\/(?!\/)\S*$/;

const heroCtaSchema = z
  .object({
    text: z.string().trim().min(1, "Cada botón necesita un texto.").max(40, "El texto del botón admite 40 caracteres."),
    url: z.string().trim().min(1, "Cada botón necesita una dirección.").max(500),
    is_external: z.boolean(),
  })
  .superRefine((cta, ctx) => {
    const valid = cta.is_external ? EXTERNAL_URL.test(cta.url) : INTERNAL_URL.test(cta.url);
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: cta.is_external
          ? "Un enlace externo debe empezar con http:// o https://."
          : "Un enlace interno debe empezar con / (por ejemplo, /tienda).",
      });
    }
  });

const heroCtasSchema = z.array(heroCtaSchema).max(MAX_HERO_CTAS, `Máximo ${MAX_HERO_CTAS} botones.`);

const heroBannerSchema = z.object({
  image_url: z.url({ protocol: /^https?$/ }),
  alt: z.string().trim().max(200, "El texto alternativo admite 200 caracteres."),
  title: z.string().trim().max(120, "El título admite 120 caracteres.").optional(),
  subtitle: z.string().trim().max(240, "El subtítulo admite 240 caracteres.").optional(),
  ctas: heroCtasSchema,
});

export const heroSettingsSchema = z.object({
  is_hero_active: z.boolean(),
  hero_type: z.enum(["video", "carousel"]),
  hero_video_url: z
    .string()
    .trim()
    .max(500)
    .regex(/^(https:\/\/|\/)\S+$/i, "La URL del video debe ser una ruta que empiece con / o una URL https://.")
    .nullable(),
  hero_video_autopause: z.boolean(),
  hero_video_title: z.string().trim().max(120, "El título admite 120 caracteres.").nullable(),
  hero_video_subtitle: z.string().trim().max(240, "El subtítulo admite 240 caracteres.").nullable(),
  hero_video_ctas: heroCtasSchema,
  hero_banners: z.array(heroBannerSchema).max(MAX_HERO_BANNERS, `Máximo ${MAX_HERO_BANNERS} banners.`),
  hero_carousel_interval_seconds: z.union([z.literal(3), z.literal(5), z.literal(7)]),
});

export type HeroCta = z.infer<typeof heroCtaSchema>;
export type HeroBanner = z.infer<typeof heroBannerSchema>;
export type HeroSettings = z.infer<typeof heroSettingsSchema>;

/** Si la tabla aún no existe o falla la lectura, la tienda se comporta como antes: Hero de video activo. */
export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  is_hero_active: true,
  hero_type: "video",
  hero_video_url: null,
  hero_video_autopause: true,
  hero_video_title: null,
  hero_video_subtitle: null,
  hero_video_ctas: [],
  hero_banners: [],
  hero_carousel_interval_seconds: 5,
};

/** Normaliza una fila de `store_settings`; un campo ilegible cae al valor por defecto, no rompe la tienda. */
export function parseHeroRow(row: Record<string, unknown> | null): HeroSettings {
  if (!row) return DEFAULT_HERO_SETTINGS;
  const parsed = heroSettingsSchema.safeParse({
    ...row,
    hero_banners: Array.isArray(row.hero_banners)
      ? row.hero_banners.map((banner) => ({ alt: "", ctas: [], ...(banner as object) }))
      : [],
  });
  return parsed.success ? parsed.data : DEFAULT_HERO_SETTINGS;
}
