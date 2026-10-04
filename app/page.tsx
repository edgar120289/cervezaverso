import { Suspense } from "react";
import Hero from "@/components/Hero";
import ContactSection from "@/components/landing/ContactSection";
import FeaturedShop from "@/components/landing/FeaturedShop";
import LandingModules from "@/components/landing/LandingModules";
import SommelierIntro from "@/components/landing/SommelierIntro";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { getLandingSettings } from "@/lib/hero-settings";

/** La portada siempre lee `store_settings` en cada visita: lo guardado en /admin/landing se ve de inmediato. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const { modules } = await getLandingSettings();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-4">
      <Hero />
      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedShop />
      </Suspense>
      <SommelierIntro />
      <LandingModules modules={modules} />
      <ContactSection />
    </div>
  );
}
