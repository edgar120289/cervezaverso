import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAIFetchError, SchemaType, type ObjectSchema } from "@google/generative-ai";
import { z } from "zod";
import { generateWithFallback } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { firstIssue } from "@/lib/validation";

const SYSTEM_PROMPT = `Eres el Sommelier Digital de Cervezaverso, una tienda mexicana de cerveza artesanal nacional e importada.
Escribes para gente curiosa que disfruta la cerveza pero no es experta: tu tono es cálido, cautivador y educativo,
como un buen amigo que sabe mucho y lo cuenta con gusto. Evitas los tecnicismos aburridos (nada de IBU, EBC,
densidades ni jerga de cervecero); si mencionas un concepto, lo explicas con palabras cotidianas.

Escribe siempre en español de México, en segunda persona cuando invites a probar, sin emojis ni markdown.
Nunca inventes datos concretos que no puedas saber (premios, fechas exactas, nombres de maestros cerveceros);
si no conoces la cervecería, habla de la tradición del estilo y del país.

Devuelve tres secciones:
- "origen" — El Origen: historia breve del estilo y de la tradición cervecera del país, y qué hace especial a esta cerveza. 2 a 3 frases.
- "perfil" — Perfil Sensorial: notas de cata en orden visual (color, espuma), olfativa (aromas) y gustativa (sabor, cuerpo, final). 3 a 4 frases evocadoras.
- "maridaje" — El Maridaje Perfecto: 2 o 3 platillos concretos (de preferencia uno de cocina mexicana) y por qué combinan. 2 a 3 frases.`;

const RESPONSE_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    origen: { type: SchemaType.STRING, description: "El Origen: historia breve." },
    perfil: { type: SchemaType.STRING, description: "Perfil Sensorial: notas visuales, olfativas y gustativas." },
    maridaje: { type: SchemaType.STRING, description: "El Maridaje Perfecto." },
  },
  required: ["origen", "perfil", "maridaje"],
};

const requestSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre de la cerveza.").max(160),
  style: z.string().trim().min(1, "Falta el estilo de la cerveza.").max(120),
  country: z.string().trim().min(1, "Falta el país de la cerveza.").max(80),
});

const responseSchema = z.object({
  origen: z.string().trim().min(1),
  perfil: z.string().trim().min(1),
  maridaje: z.string().trim().min(1),
});

type GeneratedDescription = z.infer<typeof responseSchema>;

/**
 * Sommelier Digital: genera El Origen, Perfil Sensorial y El Maridaje Perfecto
 * a partir del nombre, estilo y país. No guarda nada: el admin revisa el texto
 * en el panel y lo guarda con "Guardar cambios".
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Falta GEMINI_API_KEY en .env.local (reinicia `npm run dev` después de agregarla)." },
      { status: 500 }
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { name, style, country } = parsed.data;

  try {
    const completion = await generateWithFallback(
      "generate-description",
      process.env.GEMINI_API_KEY,
      {
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      },
      `Cerveza: ${name}
Estilo: ${style}
País: ${country}`
    );

    if (completion.response.promptFeedback?.blockReason) {
      return NextResponse.json({ error: "La IA no quiso generar esta ficha. Intenta de nuevo." }, { status: 502 });
    }
    const result = responseSchema.safeParse(JSON.parse(completion.response.text() || "null"));
    if (!result.success) {
      return NextResponse.json({ error: "La IA devolvió una respuesta incompleta. Intenta de nuevo." }, { status: 502 });
    }

    return NextResponse.json(result.data satisfies GeneratedDescription);
  } catch (err) {
    if (err instanceof GoogleGenerativeAIFetchError) {
      const message =
        err.status === 400 || err.status === 403
          ? "La GEMINI_API_KEY no es válida."
          : err.status === 429
            ? "Gemini rechazó la solicitud por límite de uso. Espera un momento e intenta de nuevo."
            : err.status === 404
              ? "Ningún modelo de Gemini está disponible. Revisa GEMINI_MODEL en .env.local."
              : err.status === 503
                ? "Gemini está saturado en este momento. Intenta de nuevo en unos segundos."
                : `Error de Gemini (${err.status ?? "sin estado"}).`;
      console.error("[generate-description] error final:", err.status, err.message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
    console.error("[generate-description]", err);
    return NextResponse.json({ error: "No se pudo generar la descripción." }, { status: 500 });
  }
}
