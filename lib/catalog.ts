import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";

/**
 * Lectura del catálogo desde Supabase (única fuente de productos).
 *
 * Usa la anon key sin cookies: `products` es de lectura pública por RLS, y así
 * el catálogo no depende de la sesión del visitante. `connection()` hace que la
 * consulta ocurra en cada request (precios y stock siempre al día) y permite
 * que la UI muestre skeletons vía <Suspense> mientras Supabase responde.
 */

export const PRODUCT_COLUMNS =
  "id, sku, name, brewery, country, style, abv, volume_ml, cost_price, sale_price, stock_status, badges, description_ai, pairing_ai, notas_origen, notas_perfil, notas_maridaje, image_url";

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn("[catalog] Supabase no está configurado (.env.local): el catálogo se mostrará vacío.");
    client = null;
    return null;
  }
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

/** PostgREST puede devolver `numeric` como string; aquí se normaliza. */
export function toProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as unknown as Product),
    abv: Number(row.abv),
    volume_ml: Number(row.volume_ml),
    cost_price: Number(row.cost_price),
    sale_price: Number(row.sale_price),
    badges: Array.isArray(row.badges) ? (row.badges as string[]) : [],
  };
}

export async function getProducts(): Promise<Product[]> {
  await connection();
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("stock_status", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[catalog] Error al leer products:", error.message);
    return [];
  }
  return data.map(toProduct);
}

/** Con `cache`: generateMetadata y la página comparten una sola consulta por request. */
export const getProductBySku = cache(async (sku: string): Promise<Product | null> => {
  await connection();
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("sku", sku)
    .maybeSingle();

  if (error) {
    console.error(`[catalog] Error al leer el producto ${sku}:`, error.message);
    return null;
  }
  return data ? toProduct(data) : null;
});

/** Para el sitemap: sólo lo necesario. */
export async function getProductSitemapEntries(): Promise<{ sku: string; updated_at: string | null }[]> {
  await connection();
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("products").select("sku, updated_at");
  if (error) {
    console.error("[catalog] Error al leer el sitemap:", error.message);
    return [];
  }
  return data;
}
