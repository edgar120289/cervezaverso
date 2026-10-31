import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSommelierNotes, overusedPairings, SommelierAIError } from "@/lib/sommelier-ai";

// Con respaldo entre modelos de Gemini (hasta ~100 s) cuando uno está saturado.
export const maxDuration = 120;

const requestSchema = z.object({ product_id: z.uuid() });

/**
 * Llenado en lote desde el inventario: genera la ficha de UNA cerveza y la guarda (notas de origen, perfil y
 * maridaje, descripción y maridaje corto; la cervecería solo si estaba vacía). El navegador llama una por una.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Producto inválido." }, { status: 400 });

  const admin = createAdminClient();
  const { data: product, error: fetchError } = await admin
    .from("products")
    .select("name, brewery, country, style, abv, volume_ml")
    .eq("id", parsed.data.product_id)
    .single();
  if (fetchError || !product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  try {
    const notes = await generateSommelierNotes(product, await overusedPairings(admin));
    const brewery = String(product.brewery ?? "").trim() || notes.cerveceria || product.brewery;
    const { error } = await admin
      .from("products")
      .update({
        notas_origen: notes.origen,
        notas_perfil: notes.perfil,
        notas_maridaje: notes.maridaje,
        description_ai: notes.descripcion,
        pairing_ai: notes.maridaje_resumen,
        brewery,
      })
      .eq("id", parsed.data.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SommelierAIError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[ai/enrich]", err);
    return NextResponse.json({ error: "No se pudo generar la ficha." }, { status: 500 });
  }
}
