import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, UtensilsCrossed, Wine } from "lucide-react";
import { getProductBySku } from "@/lib/catalog";
import { formatMXN } from "@/lib/pricing";
import AddToCartButton from "@/components/AddToCartButton";
import HealthNotice from "@/components/HealthNotice";
import FavoriteButton from "@/components/FavoriteButton";
import ProductImage from "@/components/ProductImage";

export async function generateMetadata({ params }: PageProps<"/cervezas/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return {};

  const description = `${product.style} de ${product.country}, ${product.abv}% ABV. ${product.notas_perfil ?? product.description_ai ?? ""}`.trim();
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.image_url ? [product.image_url] : undefined },
    alternates: { canonical: `/cervezas/${encodeURIComponent(product.sku)}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/cervezas/[sku]">) {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();

  // Ficha del Sommelier Digital: las notas propias mandan; si aún no existen,
  // se usan las descripciones generadas por IA.
  const fichas = [
    {
      icon: Globe2,
      title: "Origen",
      body:
        product.notas_origen ??
        [product.brewery, product.country].filter(Boolean).join(" · "),
    },
    { icon: Wine, title: "Perfil de Cata", body: product.notas_perfil ?? product.description_ai },
    { icon: UtensilsCrossed, title: "Maridaje Perfecto", body: product.notas_maridaje ?? product.pairing_ai },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <Link
        href="/#catalogo"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-black"
      >
        <ArrowLeft size={16} />
        Catálogo
      </Link>

      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] bg-white p-4 shadow-card">
          <div className="relative aspect-square overflow-hidden rounded-[20px] bg-canvas">
            <ProductImage
              src={product.image_url}
              alt={`${product.name}, ${product.style}`}
              sizes="(min-width: 768px) 560px, 100vw"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 rounded-[28px] bg-white p-6 shadow-card sm:p-8">
          <div>
            <p className="text-sm font-semibold text-muted">
              {product.style} · {product.country}
            </p>
            <h1 className="mt-1 text-4xl font-semibold leading-[1.05] tracking-[-0.045em]">
              {product.name}
            </h1>
            {product.brewery && <p className="mt-1 text-muted">{product.brewery}</p>}
          </div>

          <dl className="flex flex-wrap gap-2 text-sm">
            {[
              ["ABV", `${product.abv}%`],
              ["Volumen", `${product.volume_ml} ml`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-full bg-canvas px-4 py-2">
                <dt className="inline text-muted">{label} </dt>
                <dd className="inline font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center">
            <span className="text-3xl font-semibold tracking-[-0.04em]">{formatMXN(product.sale_price)}</span>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <AddToCartButton product={product} />
              <FavoriteButton productId={product.id} productName={product.name} size="lg" />
            </div>
          </div>
          <p className="text-xs text-muted">Precio final en MXN con IVA e IEPS incluidos.</p>
          <HealthNotice />
        </div>
      </div>

      <section aria-labelledby="sommelier-digital" className="mt-10">
        <h2 id="sommelier-digital" className="text-2xl font-semibold tracking-[-0.04em]">
          Sommelier digital
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {fichas.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[28px] bg-white p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-black/70">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 font-semibold tracking-[-0.03em]">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-black/60">
                {body || "Muy pronto nuestro sommelier completará esta nota."}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
