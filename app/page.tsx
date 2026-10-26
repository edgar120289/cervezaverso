import { Suspense } from "react";
import Hero from "@/components/Hero";
import ContactSection from "@/components/landing/ContactSection";
import FeaturedShop from "@/components/landing/FeaturedShop";
import LandingModules from "@/components/landing/LandingModules";
import SommelierIntro from "@/components/landing/SommelierIntro";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { getSpotlightProducts } from "@/lib/catalog";
import { getLandingSettings } from "@/lib/hero-settings";
import { collectSpotlightRefs } from "@/lib/landing";

/** La portada siempre lee `store_settings` en cada visita: lo guardado en /admin/landing se ve de inmediato. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getLandingSettings();
  const products = await getSpotlightProducts(collectSpotlightRefs(settings));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-4">
      {/* H1 provisional (solo lectores de pantalla y buscadores) hasta elegir su lugar visible en la portada. */}
      <h1 className="sr-only">Cerveza artesanal e importada a domicilio en CDMX y todo México</h1>
      <Hero settings={settings.hero} products={products} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedShop />
      </Suspense>
      <SommelierIntro />
      <LandingModules modules={settings.modules} products={products} />
      <ContactSection />
    </div>
  );
}
