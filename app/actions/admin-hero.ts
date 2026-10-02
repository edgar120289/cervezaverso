"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { firstIssue } from "@/lib/validation";
import { HERO_BUCKET, heroSettingsSchema, type HeroSettings } from "@/lib/hero";

export type HeroActionResult = { ok: true } | { ok: false; error: string };

function bucketPublicPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/`;
}

/**
 * Guarda la configuración completa del Hero. Los banners deben vivir en nuestro bucket;
 * los que salen de la lista también se borran del bucket.
 */
export async function guardarHero(input: HeroSettings): Promise<HeroActionResult> {
  const supabase = await requireAdmin("/admin/hero");
  const parsed = heroSettingsSchema.safeParse({
    ...input,
    hero_video_url: input.hero_video_url?.trim() ? input.hero_video_url : null,
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const settings = parsed.data;
  const prefix = bucketPublicPrefix();
  if (!settings.hero_banners.every((banner) => banner.image_url.startsWith(prefix))) {
    return { ok: false, error: `Las imágenes deben estar en el bucket ${HERO_BUCKET}.` };
  }
  if (settings.hero_banners.length === 0 && settings.hero_type === "carousel" && settings.is_hero_active) {
    return { ok: false, error: "Sube al menos un banner para usar el carrusel." };
  }

  const { data: current, error: readError } = await supabase
    .from("store_settings")
    .select("hero_banners")
    .eq("id", 1)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };

  const { data, error } = await supabase.from("store_settings").update(settings).eq("id", 1).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo guardar: la configuración no existe o no tienes permiso." };

  const kept = new Set(settings.hero_banners.map((banner) => banner.image_url));
  const removedPaths = ((current?.hero_banners as { image_url?: string }[] | null) ?? [])
    .map((banner) => banner.image_url ?? "")
    .filter((url) => url.startsWith(prefix) && !kept.has(url))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (removedPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(HERO_BUCKET).remove(removedPaths);
    if (removeError) console.error("[admin] No se pudieron borrar banners del bucket:", removeError.message);
  }

  refresh();
  return { ok: true };
}
