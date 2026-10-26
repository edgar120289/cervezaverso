import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/catalog";
import ProductGrid from "@/components/ProductGrid";

/** Fachada de la tienda: hasta 8 cervezas destacadas desde el admin y el acceso a /tienda. */
export default async function FeaturedShop() {
  const products = await getFeaturedProducts(8);

  return (
    <section id="catalogo" aria-labelledby="destacadas" className="scroll-mt-24 pt-8">
      <h1 id="destacadas" className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
        Cerveza artesanal e importada a domicilio en CDMX y todo México
      </h1>
      <h2 className="mb-5 mt-1 text-base font-normal text-muted">Cervezas destacadas</h2>
      {products.length > 0 && <ProductGrid products={products} />}
      <div className="mt-8 flex justify-center">
        <Link
          href="/tienda"
          className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
        >
          Explorar toda la tienda
          <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
