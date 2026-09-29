import { Suspense } from "react";
import Hero from "@/components/Hero";
import SommelierSection from "@/components/SommelierSection";
import { SommelierProvider } from "@/components/SommelierProvider";
import Catalog from "@/components/Catalog";
import { ProductGridSkeleton } from "@/components/Skeletons";

export default function Home() {
  return (
    <SommelierProvider>
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-4">
        <Hero />
        <SommelierSection />

        <section id="catalogo" className="scroll-mt-24 pt-8">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Catálogo</h2>
          <p className="mb-5 mt-1 text-muted">Nacional e importada, para cada ocasión.</p>
          <Suspense fallback={<ProductGridSkeleton />}>
            <Catalog />
          </Suspense>
        </section>
      </div>
    </SommelierProvider>
  );
}
