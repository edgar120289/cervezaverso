import { getHeroSettings } from "@/lib/hero-settings";
import { listPublicVideos, MEDIA_DIRS, publicFileExists } from "@/lib/media";
import HeroCarousel from "./HeroCarousel";
import HeroVideo from "./HeroVideo";

/** Portada configurable desde /admin/apariencia (`store_settings.landing_settings`). */
export default async function Hero() {
  const settings = await getHeroSettings();

  // Apagado, la página conserva su H1 para lectores de pantalla y buscadores.
  if (!settings.is_hero_active) {
    return <h1 className="sr-only">Cervezaverso, tienda de cerveza artesanal e importada</h1>;
  }

  if (settings.hero_type === "carousel" && settings.hero_banners.length > 0) {
    return (
      <HeroCarousel banners={settings.hero_banners} intervalSeconds={settings.hero_carousel_interval_seconds} />
    );
  }

  // Prioridad: URL configurada → public/hero-beer.mp4 → primer video de public/video/hero/ → sin video (fondo oscuro).
  const videoSrc =
    settings.hero_video_url ??
    (publicFileExists(MEDIA_DIRS.heroVideo) ? `/${MEDIA_DIRS.heroVideo}` : listPublicVideos(MEDIA_DIRS.heroVideos)[0]);

  return (
    <HeroVideo
      videoSrc={videoSrc}
      ctas={settings.hero_video_ctas}
      title={settings.hero_video_title}
      subtitle={settings.hero_video_subtitle}
    />
  );
}
