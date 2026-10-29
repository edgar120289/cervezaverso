"use server";

import { z } from "zod";
import { getCompleteOrderSuggestions } from "@/lib/catalog";
import type { Product } from "@/lib/types";

const inputSchema = z.object({
  styles: z.array(z.string().trim().min(1).max(120)).max(20),
  excludeIds: z.array(z.uuid()).max(50),
});

/** Sugerencias públicas para «Completa tu pedido» en el cajón del carrito (solo catálogo activo). */
export async function obtenerSugerenciasPedido(input: z.input<typeof inputSchema>): Promise<Product[]> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return [];
  return getCompleteOrderSuggestions(parsed.data.styles, parsed.data.excludeIds);
}
