import { Suspense } from "react";
import Hero from "@/components/Hero";
import ContactSection from "@/components/landing/ContactSection";
import FeaturedShop from "@/components/landing/FeaturedShop";
import LandingModules from "@/components/landing/LandingModules";
import SommelierIntro from "@/components/landing/SommelierIntro";
import TrustStrip from "@/components/landing/TrustStrip";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { getSpotlightProducts } from "@/lib/catalog";
import { getLandingSettings } from "@/lib/hero-settings";
import { collectSpotlightRefs } from "@/lib/landing";
import { homeJsonLd, jsonLdString } from "@/lib/structured-data";

/** La portada siempre lee `store_settings` en cada visita: lo guardado en /admin/landing se ve de inmediato. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getLandingSettings();
  const products = await getSpotlightProducts(collectSpotlightRefs(settings));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd()) }} />
      <Hero settings={settings.hero} products={products} />
      <div className="-mt-3">
        <Suspense fallback={<div className="h-16 rounded-[28px] bg-white shadow-card md:h-[5.5rem]" />}>
          <TrustStrip />
        </Suspense>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedShop />
      </Suspense>
      <SommelierIntro />
      <LandingModules modules={settings.modules} products={products} />
      <ContactSection />
    </div>
  );
}
