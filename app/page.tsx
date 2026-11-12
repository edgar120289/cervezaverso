import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ContactSection from "@/components/landing/ContactSection";
import FeaturedShop from "@/components/landing/FeaturedShop";
import LandingModules from "@/components/landing/LandingModules";
import SommelierIntro from "@/components/landing/SommelierIntro";
import { getSpotlightProducts } from "@/lib/catalog";
import { getLandingSettings } from "@/lib/hero-settings";
import { collectSpotlightRefs } from "@/lib/landing";
import { homeJsonLd, jsonLdString } from "@/lib/structured-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** La portada siempre lee `store_settings` en cada visita: lo guardado en /admin/landing se ve de inmediato. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getLandingSettings();
  const products = await getSpotlightProducts(collectSpotlightRefs(settings));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd()) }} />
      <Hero settings={settings.hero} products={products} />
      <FeaturedShop />
      <SommelierIntro />
      <LandingModules modules={settings.modules} products={products} />
      <ContactSection />
    </div>
  );
}
