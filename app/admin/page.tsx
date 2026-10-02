import { createClient } from "@/lib/supabase/server";
import CatalogImporter from "@/components/admin/CatalogImporter";
import ManualProductDialog from "@/components/admin/ManualProductDialog";
import ProductList, { type AdminProductRow } from "@/components/admin/ProductList";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  const { count: orderCount } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  // Se cargan todos y la búsqueda, el filtro y el orden se resuelven en el cliente (respuesta inmediata).
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, country, style, cost_price, sale_price, stock_status, image_url, is_active, created_at")
    .order("name", { ascending: true });
  const products = (data ?? []) as AdminProductRow[];

  const stats = [
    { label: "Productos", value: productCount ?? 0 },
    { label: "Pedidos", value: orderCount ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] bg-white p-5 shadow-card">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section id="ingesta" className="scroll-mt-6">
        <CatalogImporter />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
          <ManualProductDialog />
        </div>

        {error ? (
          <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
            No se pudieron cargar los productos: {error.message}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
            Todavía no hay productos. Sube un archivo o añade una cerveza manualmente.
          </div>
        ) : (
          <ProductList products={products} />
        )}
      </section>
    </div>
  );
}
