import "server-only";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  type GenerateContentResult,
  type GenerationConfig,
} from "@google/generative-ai";

// Google retira modelos con frecuencia (1.5 y 2.5 ya devuelven 404 a cuentas nuevas):
// GEMINI_MODEL va primero y el resto es respaldo automático.
const FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

const RETRYABLE_STATUS = new Set([404, 429, 500, 503]);

/** Tope por modelo y tope total: un modelo saturado no debe agotar el tiempo de la función. */
const PER_MODEL_TIMEOUT_MS = 25_000;
const TOTAL_BUDGET_MS = 100_000;

function geminiModelChain(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  return [...new Set([configured, ...FALLBACK_MODELS].filter((m): m is string => Boolean(m)))];
}

export async function generateWithFallback(
  tag: string,
  apiKey: string,
  options: { systemInstruction: string; generationConfig: GenerationConfig },
  prompt: string
): Promise<GenerateContentResult> {
  const client = new GoogleGenerativeAI(apiKey);
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastError: unknown;
  for (const modelName of geminiModelChain()) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    try {
      return await client
        .getGenerativeModel({ model: modelName, ...options }, { timeout: Math.min(PER_MODEL_TIMEOUT_MS, remaining) })
        .generateContent(prompt);
    } catch (err) {
      const status = err instanceof GoogleGenerativeAIFetchError ? err.status : undefined;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${tag}] modelo ${modelName} falló (${status ?? "sin respuesta"}):`, message.slice(0, 300));
      lastError = err;
      // Saturado, retirado o sin respuesta a tiempo: probar el siguiente. Otro error (llave, petición) se corta.
      const timedOut = status === undefined && /abort|timeout|timed out|fetch failed/i.test(message);
      if (!timedOut && (status === undefined || !RETRYABLE_STATUS.has(status))) throw err;
    }
  }
  throw lastError ?? new Error("Ningún modelo de Gemini respondió a tiempo.");
}
