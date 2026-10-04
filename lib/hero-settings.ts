import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_HERO_SETTINGS, type HeroSettings } from "@/lib/hero";
import { DEFAULT_LANDING_SETTINGS, parseLandingSettings, type LandingSettings } from "@/lib/landing";

/**
 * Lee la configuración de la landing (lectura pública por RLS). Única fuente del Hero y los bloques:
 * `store_settings.landing_settings`. Ante cualquier error, la configuración por defecto.
 */
export const getLandingSettings = cache(async (): Promise<LandingSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_settings").select("landing_settings").eq("id", 1).maybeSingle();
  if (error) {
    console.error("[landing] Error al leer store_settings:", error.message);
    return DEFAULT_LANDING_SETTINGS;
  }
  if (!data) return DEFAULT_LANDING_SETTINGS;
  return parseLandingSettings(data.landing_settings);
});

export async function getHeroSettings(): Promise<HeroSettings> {
  return (await getLandingSettings()).hero ?? DEFAULT_HERO_SETTINGS;
}
