"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { firstIssue } from "@/lib/validation";
import { HERO_BUCKET } from "@/lib/hero";
import { collectImageUrls, landingSettingsSchema, parseLandingSettings, type LandingSettings } from "@/lib/landing";

export type AppearanceActionResult = { ok: true } | { ok: false; error: string };

function bucketPublicPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/`;
}

/**
 * Guarda el Hero y los bloques en `store_settings.landing_settings`. Las imágenes (banners y bloques)
 * deben vivir en nuestro bucket; las que salen de la configuración también se borran del bucket.
 */
export async function guardarLanding(input: LandingSettings): Promise<AppearanceActionResult> {
  const supabase = await requireAdmin("/admin/landing");
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
  if (!collectImageUrls(settings).every((url) => url.startsWith(prefix))) {
    return { ok: false, error: `Las imágenes deben estar en el bucket ${HERO_BUCKET}.` };
  }
  if (hero.hero_banners.length === 0 && hero.hero_type === "carousel" && hero.is_hero_active) {
    return { ok: false, error: "Sube al menos un banner para usar el carrusel." };
  }

  const { data: current, error: readError } = await supabase
    .from("store_settings")
    .select("landing_settings")
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

  // Imágenes que ya no se usan: las que estaban en landing_settings y salieron de la configuración.
  const kept = new Set(collectImageUrls(settings));
  const removedPaths = (current ? collectImageUrls(parseLandingSettings(current.landing_settings)) : [])
    .filter((url) => url.startsWith(prefix) && !kept.has(url))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (removedPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(HERO_BUCKET).remove(removedPaths);
    if (removeError) console.error("[admin] No se pudieron borrar imágenes del bucket:", removeError.message);
  }

  refresh();
  return { ok: true };
}

export type ProductOption = { sku: string; name: string };

/**
 * Buscador del Constructor de Enlaces: hasta 8 cervezas activas por nombre o SKU. Se consulta bajo
 * demanda (el cliente no carga el catálogo) y solo para admins.
 */
export async function buscarProductosActivos(query: string): Promise<ProductOption[]> {
  const supabase = await requireAdmin("/admin/landing");
  // Fuera comodines y separadores del filtro `or` de PostgREST.
  const term = String(query ?? "")
    .replace(/[%_\\,()*]/g, " ")
    .trim()
    .slice(0, 60);
  if (term.length < 2) return [];

  const { data, error } = await supabase
    .from("products")
    .select("sku, name")
    .eq("is_active", true)
    .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
    .order("name", { ascending: true })
    .limit(8);
  if (error) {
    console.error("[admin] Error al buscar productos:", error.message);
    return [];
  }
  return data;
}
