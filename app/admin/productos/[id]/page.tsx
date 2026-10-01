import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toProduct } from "@/lib/catalog";
import { DEFAULT_MARGIN_PCT } from "@/lib/pricing";
import ProductEditForm from "@/components/admin/ProductEditForm";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  // `*` para no fallar si la migración 003 (margin_pct) aún no se aplicó.
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const product = toProduct(data);
  const margin = Number(data.margin_pct);
  const gallery = Array.isArray(data.image_urls) ? (data.image_urls as string[]) : [];
  // Productos anteriores a la migración 006 conservan su imagen única como portada.
  const initialImages = gallery.length > 0 ? gallery : product.image_url ? [product.image_url] : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-black"
      >
        <ArrowLeft size={16} />
        Volver a productos
      </Link>
      <ProductEditForm
        product={product}
        initialMargin={Number.isFinite(margin) ? margin : DEFAULT_MARGIN_PCT}
        initialImages={initialImages}
      />
    </div>
  );
}
