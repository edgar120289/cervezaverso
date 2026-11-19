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
      className="relative mx-auto flex h-full max-h-full min-h-0 w-full max-w-sm flex-col gap-2 rounded-[28px] bg-white p-3 text-left text-black shadow-card [text-shadow:none] @min-[736px]:gap-3 @min-[736px]:p-4"
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
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{product.brewery && normalCase(product.brewery)}</p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight @min-[736px]:text-lg">{normalCase(product.name)}</h3>
        <p className="mt-0.5 text-lg font-bold @min-[736px]:mt-1 @min-[736px]:text-xl">{formatMXN(product.sale_price)} MXN</p>
      </div>
      <div className="shrink-0 [&>button]:w-full">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
