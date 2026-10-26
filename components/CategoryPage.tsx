import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CatalogBrowser from "@/components/CatalogBrowser";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { categorySectionTitle } from "@/lib/category-content";
import { SITE } from "@/lib/site";
import type { Product } from "@/lib/types";

/** Página SEO de una categoría (país o estilo): H1 propio y el mismo catálogo con filtros ya acotado. */
export default function CategoryPage({
  heading,
  intro,
  products,
  path,
  body,
}: {
  heading: string;
  intro: string;
  products: Product[];
  /** Ruta de la categoría, p. ej. `/catalogo/pais/belgica` (para los datos estructurados). */
  path: string;
  /** Texto editorial de lib/category-content.ts, debajo de la cuadrícula. */
  body?: string;
}) {
  const pageUrl = `${SITE.url}${path}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Tienda", item: `${SITE.url}/tienda` },
        { "@type": "ListItem", position: 3, name: heading, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: heading,
      url: pageUrl,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE.url}/cervezas/${encodeURIComponent(product.sku)}`,
        name: product.name,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
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
      {body && (
        <section aria-labelledby="sobre-categoria" className="rounded-[28px] bg-white p-6 shadow-card sm:p-10">
          <h2 id="sobre-categoria" className="text-2xl font-semibold tracking-[-0.04em]">
            {categorySectionTitle(heading)}
          </h2>
          <p className="mt-3 max-w-[68ch] leading-relaxed text-muted">{body}</p>
        </section>
      )}
    </div>
  );
}
