"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateSalePrice } from "@/lib/pricing";
import { firstIssue, PRODUCT_IMAGE_BUCKET, productUpdateSchema, type ProductUpdate } from "@/lib/validation";

export type AdminActionResult = { ok: true; sale_price?: number } | { ok: false; error: string };

export async function actualizarProducto(input: ProductUpdate): Promise<AdminActionResult> {
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await requireAdmin();
  const { id, ...fields } = parsed.data;
  // El precio de venta siempre se deriva en el servidor con la regla de negocio.
  const sale_price = calculateSalePrice(fields.cost_price, fields.margin_pct);

  const { data, error } = await supabase
    .from("products")
    .update({ ...fields, sale_price })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo guardar: el producto no existe o no tienes permiso." };

  refresh();
  return { ok: true, sale_price };
}

const imageUrlSchema = z.object({ id: z.uuid(), image_url: z.url() });

/** Guarda la URL pública de una imagen ya subida al bucket `product-images`. */
export async function actualizarImagenProducto(id: string, image_url: string): Promise<AdminActionResult> {
  const parsed = imageUrlSchema.safeParse({ id, image_url });
  if (!parsed.success) return { ok: false, error: "URL de imagen inválida." };

  // Sólo se aceptan imágenes de nuestro propio bucket público.
  const expectedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (!parsed.data.image_url.startsWith(expectedPrefix)) {
    return { ok: false, error: "La imagen debe estar en el bucket product-images." };
  }

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .update({ image_url: parsed.data.image_url })
    .eq("id", parsed.data.id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo guardar la imagen del producto." };

  refresh();
  return { ok: true };
}
