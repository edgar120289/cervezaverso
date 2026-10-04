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
  "id, sku, name, brewery, country, style, abv, volume_ml, cost_price, sale_price, stock_status, badges, description_ai, pairing_ai, notas_origen, notas_perfil, notas_maridaje, image_url, image_urls, created_at";

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
    image_urls: Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [],
  };
}

export async function getProducts(): Promise<Product[]> {
  await connection();
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("stock_status", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[catalog] Error al leer products:", error.message);
    return [];
  }
  return data.map(toProduct);
}

/** Fachada de la landing: hasta `limit` cervezas activas con `is_featured`. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  await connection();
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("stock_status", { ascending: true })
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[catalog] Error al leer los destacados:", error.message);
    return [];
  }
  return data.map(toProduct);
}

const SEARCH_COLUMNS = ["name", "style", "brewery", "country", "description_ai", "pairing_ai", "notas_perfil", "notas_maridaje"];

/** Quita lo que rompería la sintaxis de `.or()` de PostgREST (comas, paréntesis, comodines) y acota el largo. */
function toSearchTerms(query: string): string[] {
  return [...new Set(query.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu, " ").split(/\s+/))]
    .filter((term) => term.length >= 3)
    .slice(0, 6);
}

/**
 * Búsqueda de texto libre para el Sommelier (solo activas y con existencia). Coincide con cualquier término
 * en nombre, estilo, cervecería, país o fichas, y ordena por cuántos términos acierta cada cerveza.
 */
export async function searchActiveProducts(query: string, { maxPrice, limit = 6 }: { maxPrice?: number; limit?: number } = {}): Promise<Product[]> {
  await connection();
  const supabase = getClient();
  if (!supabase) return [];

  const terms = toSearchTerms(query);
  let request = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true).neq("stock_status", "out_of_stock");
  if (maxPrice !== undefined) request = request.lte("sale_price", maxPrice);
  if (terms.length > 0) {
    request = request.or(terms.flatMap((term) => SEARCH_COLUMNS.map((column) => `${column}.ilike.%${term}%`)).join(","));
  }

  const { data, error } = await request.order("name", { ascending: true }).limit(60);
  if (error) {
    console.error("[catalog] Error en la búsqueda del Sommelier:", error.message);
    return [];
  }

  const score = (row: Record<string, unknown>) => {
    const haystack = SEARCH_COLUMNS.map((column) => String(row[column] ?? "")).join(" ").toLowerCase();
    return terms.filter((term) => haystack.includes(term)).length;
  };
  return data
    .map((row) => ({ row, score: score(row) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => toProduct(row));
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
    .eq("is_active", true)
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

  const { data, error } = await supabase.from("products").select("sku, updated_at").eq("is_active", true);
  if (error) {
    console.error("[catalog] Error al leer el sitemap:", error.message);
    return [];
  }
  return data;
}
