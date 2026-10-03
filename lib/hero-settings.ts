import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_HERO_SETTINGS, parseHeroRow, type HeroSettings } from "@/lib/hero";
import { DEFAULT_LANDING_SETTINGS, parseLandingSettings, type LandingSettings } from "@/lib/landing";

const LANDING_COLUMNS =
  "landing_settings, is_hero_active, hero_type, hero_video_url, hero_video_autopause, hero_video_title, hero_video_subtitle, hero_video_ctas, hero_banners, hero_carousel_interval_seconds";

/**
 * Lee la configuración de la landing (lectura pública por RLS): Hero y bloques en `landing_settings`.
 * Mientras no se guarde desde /admin/apariencia, el Hero sale de las columnas hero_* anteriores.
 * Ante cualquier error, la configuración por defecto.
 */
export const getLandingSettings = cache(async (): Promise<LandingSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_settings").select(LANDING_COLUMNS).eq("id", 1).maybeSingle();
  if (error) {
    console.error("[landing] Error al leer store_settings:", error.message);
    return DEFAULT_LANDING_SETTINGS;
  }
  if (!data) return DEFAULT_LANDING_SETTINGS;
  return parseLandingSettings(data.landing_settings, parseHeroRow(data));
});

export async function getHeroSettings(): Promise<HeroSettings> {
  return (await getLandingSettings()).hero ?? DEFAULT_HERO_SETTINGS;
}
