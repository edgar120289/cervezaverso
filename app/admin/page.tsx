import Image from "next/image";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";
import CatalogImporter from "@/components/admin/CatalogImporter";
import ManualProductDialog from "@/components/admin/ManualProductDialog";
import ProductRowActions from "@/components/admin/ProductRowActions";

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
  is_active: boolean;
};

function InactiveBadge() {
  return (
    <span className="ml-2 inline-block rounded-full bg-black/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-black/70">
      Inactiva
    </span>
  );
}

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
    .select("id, sku, name, country, style, cost_price, sale_price, stock_status, image_url, is_active")
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

      <section id="ingesta" className="scroll-mt-6">
        <CatalogImporter />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
          <ManualProductDialog />
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
            {search ? `No hay productos que coincidan con “${search}”.` : "Todavía no hay productos. Sube un archivo o añade una cerveza manualmente."}
          </div>
        ) : (
          <>
          <ul className="space-y-3 md:hidden">
            {products.map((product) => (
              <li
                key={product.id}
                className={`space-y-3 rounded-[28px] bg-white p-4 shadow-card ${product.is_active ? "" : "bg-white/70"}`}
              >
                <div className={`flex items-center gap-3 ${product.is_active ? "" : "opacity-60"}`}>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                    {product.image_url && (
                      <Image src={product.image_url} alt="" fill sizes="64px" className="object-contain p-1" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">
                      {product.name}
                      {!product.is_active && <InactiveBadge />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {product.country} · {product.style}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {product.sku} · {STOCK_STATUS_LABEL[product.stock_status]}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline justify-between px-1 text-sm">
                  <span className="text-muted">
                    Costo <span className="tabular-nums">{formatMXN(Number(product.cost_price))}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatMXN(Number(product.sale_price))}</span>
                </div>
                <ProductRowActions id={product.id} name={product.name} isActive={product.is_active} layout="card" />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-[28px] bg-white shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="sticky left-0 z-20 w-[11.5rem] bg-white px-4 py-4">Acciones</th>
                    <th className="sticky left-[11.5rem] z-20 min-w-[16rem] border-r border-black/5 bg-white px-4 py-4">
                      Cerveza
                    </th>
                    <th className="px-4 py-4">Estilo</th>
                    <th className="px-4 py-4">Disponibilidad</th>
                    <th className="px-4 py-4 text-right">Costo</th>
                    <th className="px-4 py-4 text-right">Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="sticky left-0 z-10 w-[11.5rem] bg-white px-4 py-3">
                        <ProductRowActions id={product.id} name={product.name} isActive={product.is_active} layout="row" />
                      </td>
                      <td className="sticky left-[11.5rem] z-10 min-w-[16rem] border-r border-black/5 bg-white px-4 py-3">
                        <div className={`flex items-center gap-3 ${product.is_active ? "" : "opacity-60"}`}>
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white">
                            {product.image_url && (
                              <Image src={product.image_url} alt="" fill sizes="44px" className="object-contain p-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {product.name}
                              {!product.is_active && <InactiveBadge />}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {product.country} · {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-black/60 ${product.is_active ? "" : "opacity-60"}`}>{product.style}</td>
                      <td className={`px-4 py-3 text-black/60 ${product.is_active ? "" : "opacity-60"}`}>
                        {STOCK_STATUS_LABEL[product.stock_status]}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums text-black/60 ${product.is_active ? "" : "opacity-60"}`}>
                        {formatMXN(Number(product.cost_price))}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${product.is_active ? "" : "opacity-60"}`}>
                        {formatMXN(Number(product.sale_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
