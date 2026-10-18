import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CatalogBrowser from "@/components/CatalogBrowser";
import { ProductGridSkeleton } from "@/components/Skeletons";
import type { Product } from "@/lib/types";

/** Página SEO de una categoría (país o estilo): H1 propio y el mismo catálogo con filtros ya acotado. */
export default function CategoryPage({
  heading,
  intro,
  products,
}: {
  heading: string;
  intro: string;
  products: Product[];
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-black"
      >
        <ArrowLeft size={16} />
        Toda la tienda
      </Link>
      <section id="catalogo" className="scroll-mt-24">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{heading}</h1>
        <p className="mb-5 mt-1 text-muted">{intro}</p>
        {products.length === 0 ? (
          <div className="rounded-[28px] bg-white px-6 py-14 text-center shadow-card">
            <p className="text-lg font-semibold tracking-[-0.03em]">Por ahora no hay cervezas en esta categoría</p>
            <Link
              href="/tienda"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-accent"
            >
              Ver toda la tienda
            </Link>
          </div>
        ) : (
          <Suspense fallback={<ProductGridSkeleton />}>
            <CatalogBrowser products={products} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
