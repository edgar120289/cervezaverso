import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import { formatMXN } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/** Tarjeta de "Cerveza destacada": foto, cervecería, nombre, precio, etiqueta editable y botón de compra. */
export default function ProductSpotlight({ product, badge }: { product: Product; badge: string }) {
  return (
    <article
      aria-label={`Cerveza destacada: ${product.name}`}
      className="relative mx-auto flex w-full max-w-sm flex-col gap-4 rounded-[28px] bg-white p-5 text-left text-black shadow-card [text-shadow:none]"
    >
      {badge && (
        <span className="absolute left-7 top-7 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <Link
        href={`/cervezas/${product.sku}`}
        className="group relative block aspect-square overflow-hidden rounded-2xl bg-white"
      >
        <ProductImage src={product.image_url} alt={product.name} sizes="(min-width: 1024px) 384px, 90vw" />
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{product.brewery}</p>
        <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
        <p className="mt-1 text-xl font-semibold">{formatMXN(product.sale_price)}</p>
      </div>
      <div className="[&>button]:w-full">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
