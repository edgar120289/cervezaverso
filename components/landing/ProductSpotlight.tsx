import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import { formatMXN } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { normalCase } from "@/lib/text-case";

/** Tarjeta de "Cerveza destacada": foto, cervecería, nombre, precio, etiqueta editable y botón de compra. */
export default function ProductSpotlight({ product, badge }: { product: Product; badge: string }) {
  return (
    <article
      aria-label={`Cerveza destacada: ${product.name}`}
      className="relative mx-auto flex h-full max-h-full min-h-0 w-full max-w-sm flex-col gap-3 rounded-[28px] bg-white p-4 text-left text-black shadow-card [text-shadow:none]"
    >
      {badge && (
        <span className="absolute left-6 top-6 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <Link
        href={`/cervezas/${product.sku}`}
        className="group relative block min-h-24 flex-1 overflow-hidden rounded-2xl bg-white"
      >
        <ProductImage src={product.image_url} alt={normalCase(product.name)} sizes="(min-width: 1024px) 384px, 90vw" thumb />
      </Link>
      <div className="shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{product.brewery}</p>
        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">{normalCase(product.name)}</h3>
        <p className="mt-1 text-xl font-bold">{formatMXN(product.sale_price)} MXN</p>
      </div>
      <div className="shrink-0 [&>button]:w-full">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
