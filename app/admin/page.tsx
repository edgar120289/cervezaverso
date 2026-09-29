import Link from "next/link";
import Image from "next/image";
import { Pencil, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  country: string;
  style: string;
  cost_price: number;
  sale_price: number;
  stock_status: StockStatus;
  image_url: string | null;
};

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 80) : "";

  const supabase = await createClient();
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  const { count: orderCount } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  let productsQuery = supabase
    .from("products")
    .select("id, sku, name, country, style, cost_price, sale_price, stock_status, image_url")
    .order("name", { ascending: true });
  if (search) {
    // Se quitan los caracteres con significado en el filtro `or` de PostgREST.
    const term = search.replace(/[,()*%\\]/g, " ");
    productsQuery = productsQuery.or(`name.ilike.%${term}%,sku.ilike.%${term}%,style.ilike.%${term}%`);
  }
  const { data, error } = await productsQuery;
  const products = (data ?? []) as ProductRow[];

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

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
          <form action="/admin" className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre, SKU o estilo"
              className="w-full rounded-full bg-white py-3 pl-10 pr-5 text-sm shadow-card outline-none focus:ring-2 focus:ring-black/15"
            />
          </form>
        </div>

        {error ? (
          <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
            No se pudieron cargar los productos: {error.message}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
            {search ? `No hay productos que coincidan con “${search}”.` : "Todavía no hay productos. Importa el Excel para empezar."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-6 py-4">Cerveza</th>
                    <th className="px-4 py-4">Estilo</th>
                    <th className="px-4 py-4">Disponibilidad</th>
                    <th className="px-4 py-4 text-right">Costo</th>
                    <th className="px-4 py-4 text-right">Venta</th>
                    <th className="px-6 py-4 text-right">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                            {product.image_url && (
                              <Image src={product.image_url} alt="" fill sizes="44px" className="object-contain p-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{product.name}</p>
                            <p className="truncate text-xs text-muted">
                              {product.country} · {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-black/60">{product.style}</td>
                      <td className="px-4 py-3 text-black/60">{STOCK_STATUS_LABEL[product.stock_status]}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-black/60">
                        {formatMXN(Number(product.cost_price))}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatMXN(Number(product.sale_price))}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-4 py-2 text-xs font-semibold transition-colors hover:bg-black hover:text-white"
                        >
                          <Pencil size={13} />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="rounded-[28px] bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold tracking-tight">Ingesta de catálogo</h2>
        <p className="mt-1 text-sm text-muted">
          Sube el Excel &ldquo;LISTA MONASTERIO&rdquo; para actualizar precios y stock
          automáticamente.
        </p>
        <Link
          href="/admin/import"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-accent"
        >
          Ir al importador
        </Link>
      </div>
    </div>
  );
}
