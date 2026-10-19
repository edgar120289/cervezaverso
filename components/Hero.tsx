import type { HeroSettings } from "@/lib/hero";
import { spotlightRef } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import HeroCarousel from "./HeroCarousel";
import HeroVideo from "./HeroVideo";

const SR_TITLE = "Cervezaverso, tienda de cerveza artesanal e importada";

/** Portada configurable desde /admin/landing: todo sale de `store_settings.landing_settings`, sin textos ni video propios. */
export default function Hero({ settings, products }: { settings: HeroSettings; products: Record<string, Product> }) {
  // Apagado, la página conserva su H1 para lectores de pantalla y buscadores.
  if (!settings.is_hero_active) return <h1 className="sr-only">{SR_TITLE}</h1>;

  if (settings.hero_type === "carousel" && settings.hero_banners.length > 0) {
    return (
      <HeroCarousel
        banners={settings.hero_banners}
        intervalSeconds={settings.hero_carousel_interval_seconds}
        products={products}
      />
    );
  }

  const style = settings.hero_video_style;
  const isEmpty =
    !settings.hero_video_url &&
    !settings.hero_video_title?.trim() &&
    !settings.hero_video_subtitle?.trim() &&
    settings.hero_video_ctas.length === 0 &&
    !spotlightRef(style);
  // Activo pero sin nada configurado: no se pinta una caja vacía.
  if (isEmpty) return <h1 className="sr-only">{SR_TITLE}</h1>;

  const ref = spotlightRef(style);
  return (
    <HeroVideo
      videoSrc={settings.hero_video_url ?? undefined}
      ctas={settings.hero_video_ctas}
      title={settings.hero_video_title}
      subtitle={settings.hero_video_subtitle}
      style={style}
      product={ref ? (products[ref] ?? null) : null}
    />
  );
}
