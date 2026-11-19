import { z } from "zod";
import type { PaymentMethod } from "@/lib/pricing";
import type { DireccionEnvio } from "@/lib/types";

/**
 * Borrador del checkout en sessionStorage (solo esta pestaña): si el cliente sale a iniciar
 * sesión, al volver encuentra todo lo que escribió. Se borra al ir a pagar.
 */
const KEY = "cervezaverso:checkout-draft";

const draftSchema = z.object({
  email: z.string().max(254).default(""),
  birthDate: z.string().max(10).default(""),
  notas: z.string().max(1000).default(""),
  metodoPago: z.enum(["mercadopago", "transferencia"]).default("mercadopago"),
  nueva: z
    .object({
      nombre_completo: z.string().max(200).default(""),
      telefono: z.string().max(40).default(""),
      calle: z.string().max(300).default(""),
      colonia: z.string().max(200).default(""),
      ciudad: z.string().max(200).default(""),
      estado: z.string().max(80).default(""),
      codigo_postal: z.string().max(10).default(""),
      referencias: z.string().max(300).default(""),
    })
    .partial()
    .default({}),
});

export type CheckoutDraft = {
  email: string;
  birthDate: string;
  notas: string;
  metodoPago: PaymentMethod;
  nueva: Partial<DireccionEnvio>;
};

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Sin almacenamiento (modo privado estricto): el checkout funciona igual.
  }
}

export function clearCheckoutDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nada que borrar.
  }
}

