import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSommelierNotes, overusedPairings, SommelierAIError } from "@/lib/sommelier-ai";
import { firstIssue } from "@/lib/validation";

export const maxDuration = 60;

const requestSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre de la cerveza.").max(160),
  style: z.string().trim().min(1, "Falta el estilo de la cerveza.").max(120),
  country: z.string().trim().min(1, "Falta el país de la cerveza.").max(80),
  brewery: z.string().trim().max(160).optional(),
  abv: z.number().min(0).max(99.99).nullable().optional(),
  volume_ml: z.number().int().min(0).max(100000).nullable().optional(),
});

/**
 * Sommelier Digital para la edición de un producto: genera la ficha y la devuelve sin guardar.
 * El admin la revisa en el panel y la guarda con "Guardar cambios".
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
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  try {
    const avoid = await overusedPairings(createAdminClient());
    return NextResponse.json(await generateSommelierNotes(parsed.data, avoid));
  } catch (err) {
    if (err instanceof SommelierAIError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[generate-description]", err);
    return NextResponse.json({ error: "No se pudo generar la descripción." }, { status: 500 });
  }
}
