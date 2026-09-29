import type { MetadataRoute } from "next";
import { getProductSitemapEntries } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await getProductSitemapEntries();

  return [
    { url: SITE.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...products.map((product) => ({
      url: `${SITE.url}/cervezas/${encodeURIComponent(product.sku)}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE.url}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
