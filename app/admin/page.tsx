import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/admin-analytics";
import DashboardInsights from "@/components/admin/DashboardInsights";
import ManualProductDialog from "@/components/admin/ManualProductDialog";
import ProductList, { type AdminProductRow } from "@/components/admin/ProductList";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Se cargan todos y la búsqueda, el filtro y el orden se resuelven en el cliente (respuesta inmediata).
  const [dashboard, { data, error }] = await Promise.all([
    getDashboardData(),
    supabase
      .from("products")
      .select("id, sku, name, brewery, country, style, abv, cost_price, sale_price, stock_status, image_url, is_active, is_featured, created_at")
      .order("name", { ascending: true }),
  ]);
  const products = (data ?? []) as AdminProductRow[];

  return (
    <div className="space-y-8">
      <DashboardInsights data={dashboard} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
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
    </div>
  );
}
