import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { downloadImage, findImageCandidates } from "@/lib/web-image";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/validation";

const bodySchema = z.object({
  productId: z.uuid(),
  /** Cuántos resultados saltar: "buscar otra" avanza en la lista de candidatos. */
  skip: z.number().int().min(0).max(11).default(0),
});

/**
 * Busca una imagen de referencia del producto en la web, la descarga al servidor y la sube
 * al bucket `product-images`. Devuelve la URL propia; el cliente la suma a la galería para
 * que una persona la revise (y la quite con la X si no sirve).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  // El texto de búsqueda sale del producto guardado, nunca de lo que mande el navegador.
  const { data: product } = await supabase
    .from("products")
    .select("sku, name, brewery")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "El producto no existe." }, { status: 404 });

  try {
    const query = [product.brewery, product.name].filter(Boolean).join(" ");
    const candidates = await findImageCandidates(query);
    const candidate = candidates[parsed.data.skip];
    if (!candidate) {
      return NextResponse.json(
        { error: candidates.length ? "No hay más resultados para esta cerveza." : "No se encontró una imagen para esta cerveza." },
        { status: 404 },
      );
    }

    const { bytes, type } = await downloadImage(candidate);
    const path = `${product.sku}/${Date.now()}-web.${type.extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, skip: parsed.data.skip });
  } catch (err) {
    console.error("[admin] Búsqueda de imagen en la web falló:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "No se pudo obtener la imagen. Inténtalo de nuevo o sube una manualmente." }, { status: 502 });
  }
}
