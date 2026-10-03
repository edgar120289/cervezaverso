import type { Metadata } from "next";
import { Suspense } from "react";
import Catalog from "@/components/Catalog";
import { ProductGridSkeleton } from "@/components/Skeletons";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Cerveza artesanal nacional e importada: filtra por país, cervecería, precio y grado de alcohol.",
  alternates: { canonical: "/tienda" },
};

export default function TiendaPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <section id="catalogo" className="scroll-mt-24">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Tienda</h1>
        <p className="mb-5 mt-1 text-muted">Nacional e importada, para cada ocasión.</p>
        <Suspense fallback={<ProductGridSkeleton />}>
          <Catalog />
        </Suspense>
      </section>
    </div>
  );
}
