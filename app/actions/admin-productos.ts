"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { findExistingProduct, slugify } from "@/lib/monasterio";
import { calculateSalePrice } from "@/lib/pricing";
import {
  firstIssue,
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGE_BUCKET,
  productCreateSchema,
  productUpdateSchema,
  type ProductCreate,
  type ProductUpdate,
} from "@/lib/validation";

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

const productIdSchema = z.uuid();

/** Prefijo de las URLs públicas de nuestro bucket: sólo se aceptan imágenes de ahí. */
function bucketPublicPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
}

const galleryUpdateSchema = z.object({
  id: productIdSchema,
  urls: z
    .array(z.url())
    .max(MAX_PRODUCT_IMAGES, `Máximo ${MAX_PRODUCT_IMAGES} imágenes por cerveza.`)
    .refine((urls) => new Set(urls).size === urls.length, "Hay imágenes repetidas."),
});

/**
 * Guarda la galería completa (el orden importa: la primera es la portada).
 * Las imágenes que salen de la galería también se borran del bucket.
 */
export async function actualizarGaleriaProducto(id: string, urls: string[]): Promise<AdminActionResult> {
  const parsed = galleryUpdateSchema.safeParse({ id, urls });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const prefix = bucketPublicPrefix();
  if (!parsed.data.urls.every((url) => url.startsWith(prefix))) {
    return { ok: false, error: "Las imágenes deben estar en el bucket product-images." };
  }

  const supabase = await requireAdmin();
  const { data: current, error: readError } = await supabase
    .from("products")
    .select("image_urls")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!current) return { ok: false, error: "El producto no existe." };

  const { data, error } = await supabase
    .from("products")
    .update({ image_urls: parsed.data.urls })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo guardar la galería del producto." };

  const kept = new Set(parsed.data.urls);
  const removedPaths = ((current.image_urls as string[] | null) ?? [])
    .filter((url) => !kept.has(url) && url.startsWith(prefix))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (removedPaths.length > 0) {
    // Limpieza best-effort: si falla, la galería ya quedó bien y sólo sobra un archivo.
    const { error: removeError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(removedPaths);
    if (removeError) console.error("[admin] No se pudieron borrar imágenes del bucket:", removeError.message);
  }

  refresh();
  return { ok: true };
}

/** Oculta o muestra una cerveza en la tienda sin borrar sus datos (RLS filtra los inactivos). */
export async function cambiarActivoProducto(id: string, isActive: boolean): Promise<AdminActionResult> {
  const parsed = z.object({ id: productIdSchema, isActive: z.boolean() }).safeParse({ id, isActive });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo actualizar: el producto no existe o no tienes permiso." };

  refresh();
  return { ok: true };
}

/** Marca o desmarca una cerveza como destacada (`is_featured`) para la landing. */
export async function cambiarDestacadoProducto(id: string, isFeatured: boolean): Promise<AdminActionResult> {
  const parsed = z.object({ id: productIdSchema, isFeatured: z.boolean() }).safeParse({ id, isFeatured });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: parsed.data.isFeatured })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo actualizar: el producto no existe o no tienes permiso." };

  refresh();
  return { ok: true };
}

/** Borra la cerveza y las fotos de su galería. Los pedidos conservan su historial (FK `on delete set null`). */
export async function eliminarProducto(id: string): Promise<AdminActionResult> {
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  const supabase = await requireAdmin();
  const { data: product } = await supabase.from("products").select("image_urls").eq("id", parsed.data).maybeSingle();

  const { data, error } = await supabase.from("products").delete().eq("id", parsed.data).select("id");
  if (error) {
    return {
      ok: false,
      error: error.code === "23503" ? "No se puede borrar: otro registro depende de esta cerveza. Desactívala en su lugar." : error.message,
    };
  }
  if (!data?.length) return { ok: false, error: "No se pudo borrar: el producto no existe o no tienes permiso." };

  const prefix = bucketPublicPrefix();
  const paths = ((product?.image_urls as string[] | null) ?? [])
    .filter((url) => url.startsWith(prefix))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
    if (removeError) console.error("[admin] No se pudieron borrar imágenes del bucket:", removeError.message);
  }

  refresh();
  return { ok: true };
}

/** Alta manual de una cerveza (plan B de la carga masiva). El sku y el precio de venta se derivan en el servidor. */
export async function crearProducto(input: ProductCreate): Promise<AdminActionResult> {
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await requireAdmin();
  const fields = parsed.data;
  const sale_price = calculateSalePrice(fields.cost_price, fields.margin_pct);
  const sku = slugify(fields.country, fields.name, String(fields.volume_ml));

  try {
    if (await findExistingProduct(supabase, { sku, name: fields.name, volume_ml: fields.volume_ml })) {
      return { ok: false, error: "Ya existe una cerveza con ese nombre y volumen. Edítala desde la tabla." };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo verificar el catálogo." };
  }

  const { error } = await supabase.from("products").insert({ ...fields, sku, sale_price });
  if (error) return { ok: false, error: error.code === "23505" ? "Ya existe una cerveza con ese país, nombre y volumen." : error.message };

  refresh();
  return { ok: true, sale_price };
}
