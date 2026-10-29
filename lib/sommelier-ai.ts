import "server-only";
import { GoogleGenerativeAIFetchError, SchemaType, type ObjectSchema } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateWithFallback } from "@/lib/gemini";

/**
 * Fichas del Sommelier (origen, perfil, maridaje y campos cortos del catálogo) con IA.
 * Con `ANTHROPIC_API_KEY` usa Claude; si no, Gemini (`GEMINI_API_KEY`). Lo usan la edición de un
 * producto (sin guardar) y el llenado en lote del inventario (guarda directo).
 */

const SYSTEM_PROMPT = `Eres el Sommelier Digital de Cervezaverso, una tienda mexicana de cerveza artesanal nacional e importada.
Escribes para gente curiosa que disfruta la cerveza pero no es experta: tu tono es cálido, cautivador y educativo,
como un buen amigo que sabe mucho y lo cuenta con gusto. Evitas los tecnicismos aburridos (nada de IBU, EBC,
densidades ni jerga de cervecero); si mencionas un concepto, lo explicas con palabras cotidianas.

Escribe siempre en español de México, con acentos y ortografía correctos, en segunda persona cuando invites a probar,
sin emojis ni markdown. Nunca inventes datos concretos que no puedas saber (premios, fechas exactas, nombres de
maestros cerveceros); si no conoces la cervecería, habla de la tradición del estilo y del país.

Campos:
- "origen" — El Origen: historia breve del estilo y de la tradición cervecera del país, y qué hace especial a esta cerveza. 2 a 3 frases.
- "perfil" — Perfil Sensorial: notas de cata en orden visual (color, espuma), olfativa (aromas) y gustativa (sabor, cuerpo, final). 3 a 4 frases evocadoras y específicas de ESTA cerveza.
- "maridaje" — El Maridaje Perfecto: exactamente 3 opciones muy distintas entre sí y por qué combinan (3 a 4 frases):
  1) una botana o snack comercial, 2) un platillo cotidiano o comida rápida, 3) un platillo de restaurante más elaborado.
  Cada ficha del catálogo debe sentirse única: elige platillos concretos y poco obvios que de verdad le vayan al estilo,
  y respeta la lista de platillos prohibidos que te dé el usuario (ya aparecen en demasiadas fichas).
- "cerveceria": marca o cervecería fabricante deducida del nombre (solo el nombre, sin "Cervecería"). Vacío si no hay certeza; nunca inventes.
- "descripcion": gancho comercial para compartir en WhatsApp y redes. MÁXIMO 100 caracteres, una sola frase, sin comillas.
- "maridaje_resumen": el maridaje en una línea de MÁXIMO 60 caracteres, por ejemplo "Ideal con carnes rojas y postres oscuros".`;

const FIELD_DESCRIPTIONS = {
  origen: "El Origen: historia breve (2 a 3 frases).",
  perfil: "Perfil Sensorial: visual, olfativo y gustativo (3 a 4 frases).",
  maridaje: "El Maridaje Perfecto: 3 opciones distintas y por qué combinan.",
  cerveceria: "Marca o cervecería fabricante; vacío si no se puede deducir.",
  descripcion: "Gancho comercial de máximo 100 caracteres.",
  maridaje_resumen: "Maridaje en una línea de máximo 60 caracteres.",
} as const;

type Field = keyof typeof FIELD_DESCRIPTIONS;
const FIELDS = Object.keys(FIELD_DESCRIPTIONS) as Field[];

const GEMINI_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: Object.fromEntries(FIELDS.map((f) => [f, { type: SchemaType.STRING, description: FIELD_DESCRIPTIONS[f] }])),
  required: FIELDS,
};

const CLAUDE_TOOL = {
  name: "guardar_ficha",
  description: "Guarda la ficha del Sommelier de una cerveza.",
  input_schema: {
    type: "object",
    properties: Object.fromEntries(FIELDS.map((f) => [f, { type: "string", description: FIELD_DESCRIPTIONS[f] }])),
    required: FIELDS,
  },
};

/** Red de seguridad: si la IA se pasa del límite, corta en la última palabra completa. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "");
}

const notesSchema = z.object({
  origen: z.string().trim().min(1),
  perfil: z.string().trim().min(1),
  maridaje: z.string().trim().min(1),
  cerveceria: z.string().trim().max(120).catch(""),
  descripcion: z.string().trim().min(1).transform((s) => clip(s, 100)),
  maridaje_resumen: z.string().trim().min(1).transform((s) => clip(s, 60)),
});

export type SommelierNotes = z.infer<typeof notesSchema>;

export type SommelierInput = {
  name: string;
  style: string;
  country: string;
  brewery?: string | null;
  abv?: number | null;
  volume_ml?: number | null;
};

export class SommelierAIError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export function aiProvider(): "claude" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

/** Cocinas para el platillo de restaurante: una al azar por ficha, para que no todas acaben en lo mismo. */
const CUISINES = [
  "mexicana regional (Oaxaca, Yucatán, Veracruz o el norte)", "japonesa", "coreana", "peruana", "mediterránea",
  "india", "tailandesa", "argentina", "española", "libanesa", "francesa de bistró", "sureña de Estados Unidos",
  "china cantonesa", "vietnamita", "italiana regional", "alemana", "belga", "británica de pub", "vegetariana de autor",
];
const SNACKS = [
  "semillas o nueces", "una botana enchilada", "algo salado de bolsa", "quesos de supermercado", "embutidos",
  "algo dulce", "aceitunas o encurtidos", "galletas o totopos", "palomitas", "frutos secos garapiñados",
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Platillos que delatan una ficha repetida. Se cuentan en el catálogo y los más usados se prohíben. */
const DISH_PATTERNS: [string, RegExp][] = [
  ["papas fritas o a la francesa", /papas (fritas|a la francesa)/],
  ["hamburguesa", /hamburguesa/],
  ["mole", /\bmole\b/],
  ["tacos de pescado", /tacos de pescado/],
  ["tacos al pastor", /al pastor/],
  ["tacos de carnitas", /carnitas/],
  ["cacahuates", /cacahuate/],
  ["queso cheddar", /cheddar/],
  ["pretzels", /pretzel/],
  ["ceviche", /ceviche/],
  ["aguachile", /aguachile/],
  ["pato", /\bpato\b/],
  ["pizza", /pizza/],
  ["costillas", /costillas/],
  ["queso azul", /queso azul|roquefort/],
  ["alitas", /alitas/],
  ["cochinita pibil", /cochinita/],
  ["salmón", /salm[oó]n/],
  ["brownie", /brownie/],
  ["cheesecake", /cheesecake/],
  ["chicharrón", /chicharr[oó]n/],
  ["nachos", /nachos/],
  ["arrachera", /arrachera/],
  ["birria", /birria/],
  ["pastel de chocolate", /pastel de chocolate/],
  ["sushi", /sushi/],
  ["curry", /\bcurry\b/],
];
const OVERUSED_FROM = 5;

/** Platillos que ya están en `OVERUSED_FROM` fichas o más (se le prohíben a la IA). */
export async function overusedPairings(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin.from("products").select("notas_maridaje").eq("is_active", true);
  if (error || !data) return [];
  const texts = data.map((row) => String(row.notas_maridaje ?? "").toLowerCase());
  return DISH_PATTERNS.filter(([, re]) => texts.filter((t) => re.test(t)).length >= OVERUSED_FROM).map(([name]) => name);
}

function userPrompt(input: SommelierInput, avoid: string[]): string {
  return [
    `Cerveza: ${input.name}`,
    input.brewery ? `Cervecería: ${input.brewery}` : null,
    `Estilo: ${input.style}`,
    `País: ${input.country}`,
    input.abv ? `Alcohol: ${input.abv}%` : null,
    input.volume_ml ? `Presentación: ${input.volume_ml} ml` : null,
    "",
    `Para el platillo de restaurante, inspírate esta vez en la cocina ${pick(CUISINES)}; para la botana, en ${pick(SNACKS)}.`,
    avoid.length > 0 ? `Platillos prohibidos (ya están en demasiadas fichas): ${avoid.join(", ")}.` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function withClaude(prompt: string): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5",
      max_tokens: 1500,
      temperature: 1,
      system: SYSTEM_PROMPT,
      tools: [CLAUDE_TOOL],
      tool_choice: { type: "tool", name: CLAUDE_TOOL.name },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[sommelier-ai] Claude respondió", res.status, detail.slice(0, 300));
    throw new SommelierAIError(
      res.status === 401 || res.status === 403
        ? "La ANTHROPIC_API_KEY no es válida."
        : res.status === 429
          ? "Claude rechazó la solicitud por límite de uso. Espera un momento e intenta de nuevo."
          : res.status === 529 || res.status >= 500
            ? "Claude está saturado en este momento. Intenta de nuevo en unos segundos."
            : `Error de Claude (${res.status}).`,
    );
  }
  const body = (await res.json()) as { content?: { type: string; input?: unknown }[] };
  return body.content?.find((part) => part.type === "tool_use")?.input ?? null;
}

async function withGemini(prompt: string): Promise<unknown> {
  try {
    const completion = await generateWithFallback(
      "sommelier-ai",
      process.env.GEMINI_API_KEY!,
      {
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { temperature: 1.1, responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA },
      },
      prompt,
    );
    if (completion.response.promptFeedback?.blockReason) {
      throw new SommelierAIError("La IA no quiso generar esta ficha. Intenta de nuevo.");
    }
    return JSON.parse(completion.response.text() || "null");
  } catch (err) {
    if (!(err instanceof GoogleGenerativeAIFetchError)) throw err;
    console.error("[sommelier-ai] Gemini:", err.status, err.message);
    throw new SommelierAIError(
      err.status === 400 || err.status === 403
        ? "La GEMINI_API_KEY no es válida."
        : err.status === 429
          ? "Gemini rechazó la solicitud por límite de uso. Espera un momento e intenta de nuevo."
          : err.status === 503
            ? "Gemini está saturado en este momento. Intenta de nuevo en unos segundos."
            : `Error de Gemini (${err.status ?? "sin estado"}).`,
    );
  }
}

/** Genera la ficha. `avoid`: platillos que ya están en demasiadas fichas (ver `overusedPairings`). */
export async function generateSommelierNotes(input: SommelierInput, avoid: string[] = []): Promise<SommelierNotes> {
  const provider = aiProvider();
  if (!provider) throw new SommelierAIError("Falta ANTHROPIC_API_KEY o GEMINI_API_KEY en Vercel.", 500);
  const prompt = userPrompt(input, avoid);
  const raw = provider === "claude" ? await withClaude(prompt) : await withGemini(prompt);
  const result = notesSchema.safeParse(raw);
  if (!result.success) throw new SommelierAIError("La IA devolvió una respuesta incompleta. Intenta de nuevo.");
  return result.data;
}
