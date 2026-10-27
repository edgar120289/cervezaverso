import { feedId } from "@/lib/feed-id";
import { getProducts } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { SITE } from "@/lib/site";
import { productSeoDescription } from "@/lib/product-description";
import { googleBrand, googleCategory, googleDescription, googleProductType, googleTitle } from "@/lib/merchant-feed";

const AVAILABLE = new Set(["in_stock", "low_stock"]);
/** Google admite hasta 10 imágenes adicionales. */
const MAX_ADDITIONAL_IMAGES = 10;

function xml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const hasImage = (p: Product) => p.image_urls.length > 0 || Boolean(p.image_url);

/**
 * Feed RSS 2.0 de Google Merchant Center con las cervezas activas y con existencia. Con código de barras
 * (`gtin`) se publica; sin él, `identifier_exists` = `no`. Sin foto
 * no se publica: Merchant Center rechaza los productos sin `image_link`.
 */
export async function GET() {
  const products = (await getProducts()).filter((p) => AVAILABLE.has(p.stock_status) && hasImage(p));

  const items = products
    .map((p) => {
      const [image, ...rest] = p.image_urls.length > 0 ? p.image_urls : p.image_url ? [p.image_url] : [];
      const brand = googleBrand(p);
      return [
        "    <item>",
        `      <g:id>${xml(feedId(p.sku))}</g:id>`,
        `      <g:title>${xml(googleTitle(p))}</g:title>`,
        `      <g:description>${xml(googleDescription(productSeoDescription(p)))}</g:description>`,
        `      <g:link>${xml(`${SITE.url}/cervezas/${encodeURIComponent(p.sku)}`)}</g:link>`,
        image ? `      <g:image_link>${xml(image)}</g:image_link>` : null,
        ...rest.slice(0, MAX_ADDITIONAL_IMAGES).map((url) => `      <g:additional_image_link>${xml(url)}</g:additional_image_link>`),
        "      <g:availability>in_stock</g:availability>",
        `      <g:price>${p.sale_price.toFixed(2)} MXN</g:price>`,
        brand ? `      <g:brand>${xml(brand)}</g:brand>` : null,
        p.gtin ? `      <g:gtin>${xml(p.gtin)}</g:gtin>` : "      <g:identifier_exists>no</g:identifier_exists>",
        "      <g:condition>new</g:condition>",
        `      <g:google_product_category>${xml(googleCategory(p))}</g:google_product_category>`,
        `      <g:product_type>${xml(googleProductType(p))}</g:product_type>`,
        "    </item>",
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(SITE.name)}</title>
    <link>${xml(SITE.url)}</link>
    <description>${xml(SITE.description)}</description>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
