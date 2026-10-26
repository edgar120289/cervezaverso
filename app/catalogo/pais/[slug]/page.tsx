import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";
import { getProducts } from "@/lib/catalog";
import { COUNTRY_CONTENT } from "@/lib/category-content";
import { getCountryCategory, productsInCountry } from "@/lib/seo-categories";

export async function generateMetadata({ params }: PageProps<"/catalogo/pais/[slug]">): Promise<Metadata> {
  const category = getCountryCategory((await params).slug);
  if (!category) return {};
  return {
    title: `Cerveza de ${category.name}`,
    description: COUNTRY_CONTENT[category.slug]?.meta,
    alternates: { canonical: `/catalogo/pais/${category.slug}` },
  };
}

export default async function PaisPage({ params }: PageProps<"/catalogo/pais/[slug]">) {
  const category = getCountryCategory((await params).slug);
  if (!category) notFound();

  const products = productsInCountry(await getProducts(), category);
  return (
    <CategoryPage
      heading={`Cerveza de ${category.name}`}
      intro={`Cervezas de ${category.name} disponibles en Cervezaverso. Filtra por precio, grado de alcohol o cervecería.`}
      products={products}
      path={`/catalogo/pais/${category.slug}`}
      body={COUNTRY_CONTENT[category.slug]?.body}
    />
  );
}
