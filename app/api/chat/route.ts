import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { createGoogle } from "@ai-sdk/google";
import { z } from "zod";
import { searchActiveProducts } from "@/lib/catalog";
import { getClientIp } from "@/lib/security/form-guard";
import { isWithinRateLimit } from "@/lib/security/rate-limit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres Graciela, la Sommelier de Cervezaverso. Tu tono es PROFESIONAL, educado, formal y amable. ESTRICTAMENTE PROHIBIDO usar jerga, lenguaje coloquial de barrio o exceso de confianza.
Regla 1: Sé sumamente breve: UNA sola oración de cortesía como máximo. Eres únicamente la presentadora del carrusel visual: no describas, no compares ni enumeres las cervezas, porque el carrusel ya muestra nombre, estilo y precio. Si mencionas una cerveza por nombre, que sea la mejor opción del resultado de la tool.
Regla 2: Si te piden agua, refresco, vino o destilados, aclara educadamente que solo vendemos cerveza artesanal, pero recomienda una cerveza que se acerque a esa sensación (ej. algo muy ligero).
Regla 3: NUNCA generes enlaces de texto ni listas Markdown para los productos. Tu único trabajo es invocar la tool 'buscarCervezas', dar tu breve respuesta en texto y detenerte.
Nunca inventes productos: recomienda solo lo que devuelva la tool.`;

/** Solo conversan usuario y asistente; el resto (system, tools, partes que no sean texto) se descarta del cliente. */
const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(100),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.object({ type: z.string() }).loose()).max(30),
      })
    )
    .min(1)
    .max(30),
});

const MAX_TEXT_LENGTH = 1500;

function textOnly(messages: z.infer<typeof bodySchema>["messages"]): UIMessage[] {
  return messages
    .map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts.flatMap((part) =>
        part.type === "text" && typeof part.text === "string"
          ? [{ type: "text" as const, text: part.text.slice(0, MAX_TEXT_LENGTH) }]
          : []
      ),
    }))
    .filter((message) => message.parts.length > 0);
}

const buscarCervezas = tool({
  description:
    "Busca cervezas ACTIVAS y con existencia en el catálogo de Cervezaverso. Úsala antes de recomendar cualquier cerveza.",
  inputSchema: z.object({
    consulta: z
      .string()
      .max(120)
      .describe("Texto libre: estilo, sabor, nombre, país, cervecería o maridaje (ej. 'stout chocolate', 'IPA cítrica', 'tacos')."),
    precioMaximo: z.number().positive().optional().describe("Precio máximo en MXN, solo si la persona lo mencionó."),
  }),
  execute: async ({ consulta, precioMaximo }) => {
    const products = await searchActiveProducts(consulta, { maxPrice: precioMaximo });
    // Sin `cost_price`: este resultado viaja al navegador para pintar las tarjetas.
    return products.map((product) => ({ ...product, cost_price: undefined }));
  },
});

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat] Falta GEMINI_API_KEY.");
    return Response.json({ error: "El Sommelier no está disponible por ahora." }, { status: 503 });
  }

  if (!(await isWithinRateLimit("chat", await getClientIp()))) {
    return Response.json({ error: "Demasiados mensajes. Espera unos minutos e intenta de nuevo." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Solicitud no válida." }, { status: 400 });

  const messages = textOnly(parsed.data.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const google = createGoogle({ apiKey });
  const result = streamText({
    model: google("gemini-flash-latest"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { buscarCervezas },
    stopWhen: isStepCount(4),
    onError: ({ error }) => console.error("[chat] Error del modelo:", error),
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
