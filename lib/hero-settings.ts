import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_HERO_SETTINGS, parseHeroRow, type HeroSettings } from "@/lib/hero";

const HERO_COLUMNS =
  "is_hero_active, hero_type, hero_video_url, hero_video_autopause, hero_video_ctas, hero_banners, hero_carousel_interval_seconds";

/** Lee la configuración del Hero (lectura pública por RLS). Ante cualquier error, el Hero por defecto. */
export async function getHeroSettings(): Promise<HeroSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_settings").select(HERO_COLUMNS).eq("id", 1).maybeSingle();
  if (error) {
    console.error("[hero] Error al leer store_settings:", error.message);
    return DEFAULT_HERO_SETTINGS;
  }
  return parseHeroRow(data);
}
