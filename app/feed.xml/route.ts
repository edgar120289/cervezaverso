import { createHash } from "node:crypto";
import { getProducts } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { productSeoDescription } from "@/lib/product-description";

const MAX_ID_LENGTH = 50;

/** Google limita g:id a 50 caracteres: si el SKU es más largo, se recorta y se añade un hash para que siga siendo único y estable. */
function feedId(sku: string): string {
  if (sku.length <= MAX_ID_LENGTH) return sku;
  const hash = createHash("sha1").update(sku).digest("hex").slice(0, 8);
  return `${sku.slice(0, MAX_ID_LENGTH - 9)}-${hash}`;
}

const AVAILABLE = new Set(["in_stock", "low_stock"]);

function xml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Feed RSS 2.0 de Google Merchant Center con las cervezas activas y con existencia. */
export async function GET() {
  const products = (await getProducts()).filter((p) => AVAILABLE.has(p.stock_status));

  const items = products
    .map((p) => {
      const description = productSeoDescription(p);
      const image = p.image_urls[0] ?? p.image_url;
      return [
        "    <item>",
        `      <g:id>${xml(feedId(p.sku))}</g:id>`,
        `      <g:title>${xml(p.name)}</g:title>`,
        `      <g:description>${xml(description)}</g:description>`,
        `      <g:link>${xml(`${SITE.url}/cervezas/${encodeURIComponent(p.sku)}`)}</g:link>`,
        image ? `      <g:image_link>${xml(image)}</g:image_link>` : null,
        `      <g:price>${p.sale_price.toFixed(2)} MXN</g:price>`,
        "      <g:availability>in_stock</g:availability>",
        `      <g:brand>${xml(SITE.name)}</g:brand>`,
        "      <g:condition>new</g:condition>",
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
