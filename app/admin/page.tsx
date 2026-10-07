import { createClient } from "@/lib/supabase/server";
import ManualProductDialog from "@/components/admin/ManualProductDialog";
import ProductList, { type AdminProductRow } from "@/components/admin/ProductList";

export default async function AdminInventarioPage() {
  const supabase = await createClient();

  // Se cargan todos y la búsqueda, el filtro y el orden se resuelven en el cliente (respuesta inmediata).
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, brewery, country, style, abv, cost_price, sale_price, stock_status, image_url, is_active, is_featured, created_at")
    .order("name", { ascending: true });
  const products = (data ?? []) as AdminProductRow[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Inventario</h2>
        <ManualProductDialog />
      </div>

      {error ? (
        <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
          No se pudieron cargar los productos: {error.message}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          Todavía no hay productos. Usa la carga masiva o añade una cerveza manualmente.
        </div>
      ) : (
        <ProductList products={products} />
      )}
    </section>
  );
}
