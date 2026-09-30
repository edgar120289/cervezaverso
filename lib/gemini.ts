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

export function geminiModelChain(): string[] {
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
  let lastError: unknown;
  for (const modelName of geminiModelChain()) {
    try {
      return await client.getGenerativeModel({ model: modelName, ...options }).generateContent(prompt);
    } catch (err) {
      console.error(`[${tag}] modelo ${modelName} falló:`, err);
      lastError = err;
      const status = err instanceof GoogleGenerativeAIFetchError ? err.status : undefined;
      if (status === undefined || !RETRYABLE_STATUS.has(status)) throw err;
    }
  }
  throw lastError;
}
