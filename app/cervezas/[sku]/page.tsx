import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, UtensilsCrossed, Wine } from "lucide-react";
import { getProductBySku, getSimilarProducts } from "@/lib/catalog";
import ProductGrid from "@/components/ProductGrid";
import { calculateShippingCost, formatMXN } from "@/lib/pricing";
import AddToCartButton from "@/components/AddToCartButton";
import HealthNotice from "@/components/HealthNotice";
import FavoriteButton from "@/components/FavoriteButton";
import ProductGallery from "@/components/ProductGallery";
import SommelierAudio from "@/components/SommelierAudio";
import ShareButton from "@/components/ShareButton";
import { SITE } from "@/lib/site";
import { productSeoDescription } from "@/lib/product-description";
import type { StockStatus } from "@/lib/types";

const SCHEMA_AVAILABILITY: Record<StockStatus, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

export async function generateMetadata({ params }: PageProps<"/cervezas/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return {};

  const description = `${product.style} de ${product.country}, ${product.abv}% ABV. ${product.notas_perfil ?? product.description_ai ?? ""}`.trim();
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description: product.description_ai ?? description, images: product.image_url ? [product.image_url] : undefined },
    alternates: { canonical: `/cervezas/${encodeURIComponent(product.sku)}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/cervezas/[sku]">) {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();
  const similar = await getSimilarProducts(product);

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

  const productUrl = `${SITE.url}/cervezas/${encodeURIComponent(product.sku)}`;
  const images = product.image_urls.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : [];
  // Los SKU heredados del sistema anterior pasan de 40 caracteres: en el JSON-LD se usa uno corto y estable.
  const schemaSku =
    product.sku.length >= 3 && product.sku.length <= 40 ? product.sku : `CVZ-${product.id.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: schemaSku,
    url: productUrl,
    ...(images.length > 0 && { image: images }),
    description: productSeoDescription(product),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: product.sale_price.toFixed(2),
      priceCurrency: "MXN",
      availability: SCHEMA_AVAILABILITY[product.stock_status],
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: calculateShippingCost(product.sale_price).toFixed(2), currency: "MXN" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "MX" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 6, unitCode: "DAY" },
        },
      },
      // Debe coincidir con la sección "Cambios, devoluciones y cancelaciones" de /terminos.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "MX",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 5,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-black"
      >
        <ArrowLeft size={16} />
        Catálogo
      </Link>

      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] bg-white p-4 shadow-card">
          <ProductGallery
            images={product.image_urls.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : []}
            alt={`${product.name}, ${product.style}`}
          />
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
              <ShareButton
                title={product.name}
                text={product.description_ai ?? `${product.style} de ${product.country} en Cervezaverso`}
              />
            </div>
          </div>
          <p className="text-xs text-muted">Precio final en MXN con IVA e IEPS incluidos.</p>
          <HealthNotice />
        </div>
      </div>

      <section aria-labelledby="sommelier-digital" className="mt-10">
        <div className="flex items-center gap-2">
          <h2 id="sommelier-digital" className="text-2xl font-semibold tracking-[-0.04em]">
            Sommelier digital
          </h2>
          <SommelierAudio
            text={fichas
              .filter((f) => f.body)
              .map((f) => `${f.title}. ${f.body}`)
              .join(" ")}
          />
        </div>
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

      {similar.length > 0 && (
        <section aria-labelledby="similares" className="mt-10 pb-6">
          <h2 id="similares" className="text-2xl font-semibold tracking-[-0.04em]">
            También te podría gustar
          </h2>
          <div className="mt-4">
            <ProductGrid products={similar} />
          </div>
        </section>
      )}
    </div>
  );
}
