import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SYSTEM_PROMPT = `Eres un sommelier cervecero apasionado que escribe para Cervezaverso,
una tienda en línea de cerveza artesanal. Tu tono es educativo, sensorial y
entusiasta, dirigido a público general (no expertos). Respondes siempre en
español, en JSON válido con las claves "description_ai", "pairing_ai" y "notas_origen".
"description_ai": 2-3 frases evocadoras sobre aroma, sabor y cuerpo (Perfil de Cata).
"pairing_ai": 1-2 frases con sugerencias de maridaje concretas (Maridaje Perfecto).
"notas_origen": 1-2 frases sobre la región y la tradición cervecera de donde viene.`;

/**
 * Cascarón de enriquecimiento con IA (SPEC.md #6.4).
 * Recibe un product_id, genera description_ai, pairing_ai y notas_origen con
 * OpenAI, y actualiza el registro en Supabase. Las notas de perfil y maridaje de
 * la ficha (notas_perfil / notas_maridaje) toman estos textos si están vacías.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurada." },
      { status: 500 }
    );
  }

  const { product_id } = await req.json();
  if (!product_id) {
    return NextResponse.json({ error: "Falta product_id." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: product, error: fetchError } = await admin
    .from("products")
    .select("name, brewery, country, style, abv, volume_ml")
    .eq("id", product_id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Cerveza: ${product.name}\nCervecería: ${product.brewery ?? "N/D"}\nPaís: ${product.country}\nEstilo: ${product.style}\nABV: ${product.abv}%\nVolumen: ${product.volume_ml}ml`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "La IA no devolvió contenido." }, { status: 502 });
  }

  const { description_ai, pairing_ai, notas_origen } = JSON.parse(content);

  const { error: updateError } = await admin
    .from("products")
    .update({ description_ai, pairing_ai, notas_origen })
    .eq("id", product_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ description_ai, pairing_ai, notas_origen });
}
