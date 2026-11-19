"use server";

import { z } from "zod";
import { getCartSnapshot, getCompleteOrderSuggestions } from "@/lib/catalog";
import type { Product } from "@/lib/types";

const inputSchema = z.object({
  styles: z.array(z.string().trim().min(1).max(120)).max(20),
  excludeIds: z.array(z.uuid()).max(50),
});

/** Sugerencias públicas para «Agrega una más» del carrito (solo catálogo activo, con foto y existencia). */
export async function obtenerSugerenciasPedido(input: z.input<typeof inputSchema>): Promise<Product[]> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return [];
  return getCompleteOrderSuggestions(parsed.data.styles, parsed.data.excludeIds, 4);
}

const idsSchema = z.array(z.uuid()).min(1).max(100);

/**
 * Precio y existencia actuales de lo que hay en el carrito (lectura pública, solo activas).
 * Sirve para mostrar lo que se cobrará; el cobro lo vuelve a calcular `registrarPedido`.
 * `null` si no se pudo consultar (el carrito se queda como está).
 */
export async function revisarCarrito(ids: string[]): Promise<Product[] | null> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return null;
  try {
    return await getCartSnapshot(parsed.data);
  } catch {
    return null;
  }
}
