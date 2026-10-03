"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { firstIssue } from "@/lib/validation";
import { HERO_BUCKET, parseHeroRow } from "@/lib/hero";
import { landingSettingsSchema, parseLandingSettings, type LandingSettings } from "@/lib/landing";

export type AppearanceActionResult = { ok: true } | { ok: false; error: string };

function bucketPublicPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/`;
}

/**
 * Guarda el Hero y los bloques en `store_settings.landing_settings`. Los banners deben vivir
 * en nuestro bucket; los que salen de la lista también se borran del bucket.
 */
export async function guardarApariencia(input: LandingSettings): Promise<AppearanceActionResult> {
  const supabase = await requireAdmin("/admin/apariencia");
  const parsed = landingSettingsSchema.safeParse({
    ...input,
    hero: {
      ...input.hero,
      hero_video_url: input.hero?.hero_video_url?.trim() ? input.hero.hero_video_url : null,
      hero_video_title: input.hero?.hero_video_title?.trim() ? input.hero.hero_video_title : null,
      hero_video_subtitle: input.hero?.hero_video_subtitle?.trim() ? input.hero.hero_video_subtitle : null,
    },
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const settings = parsed.data;
  const { hero } = settings;
  const prefix = bucketPublicPrefix();
  if (!hero.hero_banners.every((banner) => banner.image_url.startsWith(prefix))) {
    return { ok: false, error: `Las imágenes deben estar en el bucket ${HERO_BUCKET}.` };
  }
  if (hero.hero_banners.length === 0 && hero.hero_type === "carousel" && hero.is_hero_active) {
    return { ok: false, error: "Sube al menos un banner para usar el carrusel." };
  }

  const { data: current, error: readError } = await supabase
    .from("store_settings")
    .select("landing_settings, hero_banners")
    .eq("id", 1)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };

  const { data, error } = await supabase
    .from("store_settings")
    .update({ landing_settings: settings })
    .eq("id", 1)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo guardar: la configuración no existe o no tienes permiso." };

  // Banners que ya no se usan: los de landing_settings y, en el primer guardado, los de las columnas anteriores.
  const previous = current
    ? parseLandingSettings(current.landing_settings, parseHeroRow(current)).hero.hero_banners
    : [];
  const kept = new Set(hero.hero_banners.map((banner) => banner.image_url));
  const removedPaths = previous
    .map((banner) => banner.image_url)
    .filter((url) => url.startsWith(prefix) && !kept.has(url))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (removedPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(HERO_BUCKET).remove(removedPaths);
    if (removeError) console.error("[admin] No se pudieron borrar banners del bucket:", removeError.message);
  }

  refresh();
  return { ok: true };
}
