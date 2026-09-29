"use server";

import { z } from "zod";
import { getProducts } from "@/lib/catalog";
import { recommend, type Recommendation } from "@/lib/sommelier";

const answersSchema = z.object({
  flavor: z.enum(["ligera", "lupulada", "tostada", "frutal", "belga"]),
  occasion: z.enum(["tacos", "carnes", "mariscos", "postres", "sola"]),
  intensity: z.enum(["suave", "media", "intensa", "sin"]),
});

/** Server Action del quiz del Sommelier: recomienda hasta 3 cervezas de Supabase. */
export async function recommendProducts(answers: unknown): Promise<Recommendation[]> {
  const parsed = answersSchema.safeParse(answers);
  if (!parsed.success) return [];
  return recommend(await getProducts(), parsed.data);
}
