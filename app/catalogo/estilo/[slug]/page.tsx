import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";
import { getProducts } from "@/lib/catalog";
import { getStyleCategory, productsInStyle } from "@/lib/seo-categories";

export async function generateMetadata({ params }: PageProps<"/catalogo/estilo/[slug]">): Promise<Metadata> {
  const category = getStyleCategory((await params).slug);
  if (!category) return {};
  return {
    title: category.heading,
    description: `${category.heading} en Cervezaverso: artesanal e importada, con envío a toda la República Mexicana.`,
    alternates: { canonical: `/catalogo/estilo/${category.slug}` },
  };
}

export default async function EstiloPage({ params }: PageProps<"/catalogo/estilo/[slug]">) {
  const category = getStyleCategory((await params).slug);
  if (!category) notFound();

  const products = productsInStyle(await getProducts(), category);
  return (
    <CategoryPage
      heading={category.heading}
      intro={`Nuestra selección de cervezas ${category.name}. Filtra por país, precio, grado de alcohol o cervecería.`}
      products={products}
    />
  );
}
