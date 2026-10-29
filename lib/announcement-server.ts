import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_ANNOUNCEMENT,
  resolveAnnouncement,
  type AnnouncementSettings,
  type AnnouncementValues,
} from "@/lib/announcement";
import { countryKey } from "@/lib/country-flags";
import { parseLandingSettings } from "@/lib/landing";
import { formatMXN, freeShippingThreshold, VOLUME_DISCOUNT_PCT, VOLUME_DISCOUNT_THRESHOLD } from "@/lib/pricing";

export const ANNOUNCEMENT_TAG = "announcement";

export type AnnouncementData = {
  enabled: boolean;
  scope: AnnouncementSettings["scope"];
  href: string;
  messages: string[];
};

/** Cifras reales para las claves de los mensajes ({cervezas}, {envio_cdmx}…). */
export function announcementValues(stats: { beers: number; countries: number }): AnnouncementValues {
  return {
    "{cervezas}": String(stats.beers),
    "{paises}": String(stats.countries),
    "{envio_cdmx}": formatMXN(freeShippingThreshold("metro")),
    "{envio_nacional}": formatMXN(freeShippingThreshold("nacional")),
    "{descuento_desde}": formatMXN(VOLUME_DISCOUNT_THRESHOLD),
    "{descuento}": String(VOLUME_DISCOUNT_PCT),
  };
}

/** Cervezas activas y países distintos, con el cliente anónimo (sin cookies, para poder cachear). */
export async function readCatalogStats(): Promise<{ beers: number; countries: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { beers: 0, countries: 0 };
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("products").select("country").eq("is_active", true);
  if (error) {
    console.error("[announcement] Error al leer las cifras del catálogo:", error.message);
    return { beers: 0, countries: 0 };
  }
  const countries = new Set(data.map((row) => countryKey(String(row.country ?? ""))).filter(Boolean));
  return { beers: data.length, countries: countries.size };
}

/**
 * Barra de anuncios para el layout. Se cachea una hora (y se renueva al guardar en /admin/landing) para
 * no volver dinámicas todas las páginas: el layout no lee cookies.
 */
export const getAnnouncement = unstable_cache(
  async (): Promise<AnnouncementData> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let settings = DEFAULT_ANNOUNCEMENT;
    if (url && anonKey) {
      const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data, error } = await supabase.from("store_settings").select("landing_settings").eq("id", 1).maybeSingle();
      if (error) console.error("[announcement] Error al leer store_settings:", error.message);
      else if (data) settings = parseLandingSettings(data.landing_settings).announcement;
    }
    const messages = resolveAnnouncement(settings.messages, announcementValues(await readCatalogStats()));
    return { enabled: settings.enabled && messages.length > 0, scope: settings.scope, href: settings.href, messages };
  },
  ["announcement-v1"],
  { tags: [ANNOUNCEMENT_TAG], revalidate: 3600 },
);
