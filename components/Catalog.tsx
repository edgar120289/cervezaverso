import { getProducts } from "@/lib/catalog";
import CatalogBrowser from "./CatalogBrowser";
import BottleFallback from "./BottleFallback";

/** Catálogo leído de Supabase. Se envuelve en <Suspense> con `ProductGridSkeleton`. */
export default async function Catalog() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-14 text-center shadow-card">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f4f5] text-black/40">
          <BottleFallback className="h-10 w-10" />
        </div>
        <p className="text-lg font-semibold tracking-[-0.03em]">El catálogo se está llenando</p>
        <p className="max-w-sm text-sm text-black/50">
          Muy pronto verás aquí nuestras cervezas. Mientras tanto, escríbenos por WhatsApp.
        </p>
      </div>
    );
  }

  return <CatalogBrowser products={products} />;
}
