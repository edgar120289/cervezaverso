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

const DEFAULT_MODEL = "gemini-3.8-flash";

const SYSTEM_PROMPT = `Eres Graciela, la carismática y experta Sommelier de Cervezaverso. Hablas en español de México, eres amigable, experta cervecera y directa. Tu objetivo es recomendar cervezas reales de nuestro catálogo para guiar a la compra. NUNCA inventes productos. SIEMPRE usa la tool 'buscarCervezas' para consultar el inventario activo. Muestra los resultados de forma atractiva, usando Markdown para negritas y generando enlaces hacia la ficha del producto (/cervezas/SKU). Sé concisa, no des discursos largos.`;

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
    return products.map((product) => ({
      Nombre: product.name,
      Estilo: product.style,
      Precio: product.sale_price,
      SKU: product.sku,
      Descripción: product.description_ai ?? product.notas_perfil ?? null,
    }));
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
    model: google(process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { buscarCervezas },
    stopWhen: isStepCount(4),
    onError: ({ error }) => console.error("[chat] Error del modelo:", error),
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
