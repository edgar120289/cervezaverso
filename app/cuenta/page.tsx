import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Heart, MapPin, Package, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_COLUMNS, toProduct } from "@/lib/catalog";
import { formatMXN } from "@/lib/pricing";
import { ESTADO_BADGE, folio, formatFecha } from "@/lib/pedidos";
import { eliminarDireccion, hacerPredeterminada } from "@/app/actions/cuenta";
import ProductGrid from "@/components/ProductGrid";
import SignOutButton from "@/components/SignOutButton";
import LoyaltyProgress, { type Recompensa } from "@/components/LoyaltyProgress";
import TribeSelector from "@/components/TribeSelector";
import { toTribuId } from "@/lib/tribus";
import type { Direccion, EstadoPedido } from "@/lib/types";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

type PedidoResumen = {
  id: string;
  fecha: string;
  estado: EstadoPedido;
  total: number;
  metodo_envio: string;
  pedido_items: { cantidad: number }[];
};

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // El proxy ya redirige sin sesión; esto cubre una sesión que expire a medio request.
  if (!user) redirect("/login?next=/cuenta");

  // RLS limita cada consulta a las filas del propio cliente.
  const [perfilRes, recompensasRes, pedidosRes, favoritosRes, direccionesRes] = await Promise.all([
    supabase.from("users").select("avatar_team, bottle_count, niveles_secretos").eq("id", user.id).maybeSingle(),
    supabase
      .from("promo_codes")
      .select("code, reward_level, reward_label, times_used")
      .eq("user_id", user.id)
      .not("reward_level", "is", null)
      .order("reward_level", { ascending: true }),
    supabase
      .from("pedidos")
      .select("id, fecha, estado, total, metodo_envio, pedido_items (cantidad)")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
    supabase
      .from("favorites")
      .select(`created_at, products (${PRODUCT_COLUMNS})`)
      .order("created_at", { ascending: false }),
    supabase
      .from("direcciones")
      .select("id, nombre_completo, telefono, calle, colonia, ciudad, estado, codigo_postal, referencias, predeterminada")
      .order("predeterminada", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const pedidos = (pedidosRes.data ?? []) as unknown as PedidoResumen[];
  const favoritos = (favoritosRes.data ?? [])
    .map((row) => row.products as unknown as Record<string, unknown> | null)
    .filter((product): product is Record<string, unknown> => product !== null)
    .map(toProduct);
  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const recompensas = (recompensasRes.data ?? []) as Recompensa[];
  const tribuActual = toTribuId(perfilRes.data?.avatar_team);
  const loadError = perfilRes.error ?? recompensasRes.error ?? pedidosRes.error ?? favoritosRes.error ?? direccionesRes.error;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Mi cuenta</h1>
          <p className="mt-1 text-muted">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {loadError && (
        <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm text-danger">
          No pudimos cargar toda tu información: {loadError.message}
        </p>
      )}

      <section aria-labelledby="mi-progreso" className="space-y-4">
        <SectionHeading id="mi-progreso" icon={<Trophy size={20} />} title="Mi Progreso" count={0} />
        <LoyaltyProgress
          botellas={perfilRes.data?.bottle_count ?? 0}
          recompensas={recompensas}
          nivelesSecretos={perfilRes.data?.niveles_secretos ?? false}
        />
      </section>

      <section aria-labelledby="mi-tribu" className="space-y-4">
        <SectionHeading id="mi-tribu" icon={<Users size={20} />} title="Mi Tribu Cervecera" count={0} />
        <TribeSelector current={tribuActual} />
      </section>

      {/* Historial de pedidos */}
      <section aria-labelledby="mis-pedidos" className="space-y-4">
        <SectionHeading id="mis-pedidos" icon={<Package size={20} />} title="Mis pedidos" count={pedidos.length} />
        {pedidos.length === 0 ? (
          <EmptyState text="Todavía no tienes pedidos." cta="Explorar catálogo" href="/tienda" />
        ) : (
          <ul className="space-y-3">
            {pedidos.map((pedido) => {
              const piezas = pedido.pedido_items.reduce((sum, item) => sum + item.cantidad, 0);
              return (
                <li key={pedido.id}>
                  <Link
                    href={`/pedido/${pedido.id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-[28px] bg-white px-6 py-5 shadow-card transition-transform active:scale-[0.99] sm:grid-cols-[1.2fr_1.5fr_1fr_1fr_auto]"
                  >
                    <p className="font-semibold tabular-nums">#{folio(pedido.id)}</p>
                    <p className="order-last col-span-2 text-sm text-muted sm:order-none sm:col-span-1">
                      {formatFecha(pedido.fecha)} · {piezas} {piezas === 1 ? "pieza" : "piezas"}
                    </p>
                    <span
                      className={`hidden w-fit rounded-full px-3 py-1 text-xs font-semibold sm:inline ${ESTADO_BADGE[pedido.estado]}`}
                    >
                      {pedido.estado}
                    </span>
                    <p className="text-right font-semibold tabular-nums">{formatMXN(Number(pedido.total))}</p>
                    <ChevronRight
                      size={18}
                      className="hidden text-black/25 transition-transform group-hover:translate-x-0.5 sm:block"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Favoritos */}
      <section aria-labelledby="mis-favoritos" className="space-y-4">
        <SectionHeading id="mis-favoritos" icon={<Heart size={20} />} title="Favoritas" count={favoritos.length} />
        {favoritos.length === 0 ? (
          <EmptyState
            text="Toca el corazón de cualquier cerveza para guardarla aquí."
            cta="Descubrir cervezas"
            href="/tienda"
          />
        ) : (
          <ProductGrid products={favoritos} />
        )}
      </section>

      {/* Direcciones */}
      <section aria-labelledby="mis-direcciones" className="space-y-4">
        <SectionHeading
          id="mis-direcciones"
          icon={<MapPin size={20} />}
          title="Direcciones de envío"
          count={direcciones.length}
        />
        {direcciones.length === 0 ? (
          <EmptyState text="Se guardan solas en tu primera compra para que la siguiente sea en 1 clic." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {direcciones.map((d) => (
              <li
                key={d.id}
                className={`flex flex-col rounded-[28px] border bg-white p-6 shadow-card ${
                  d.predeterminada ? "border-accent/25" : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{d.nombre_completo}</p>
                  {d.predeterminada && (
                    <span className="shrink-0 rounded-pill border border-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      1 clic
                    </span>
                  )}
                </div>
                <div className="mt-2 flex-1 space-y-0.5 text-sm text-muted">
                  <p>{d.calle}</p>
                  <p>
                    {d.colonia}, {d.ciudad}
                  </p>
                  <p>
                    {d.estado}, C.P. {d.codigo_postal}
                  </p>
                  <p>Tel. {d.telefono}</p>
                </div>
                <div className="mt-4 flex gap-4 text-sm font-semibold">
                  {!d.predeterminada && (
                    <form action={hacerPredeterminada}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="text-accent hover:underline">
                        Usar para 1 clic
                      </button>
                    </form>
                  )}
                  <form action={eliminarDireccion}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="text-muted hover:text-danger">
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  icon,
  title,
  count,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.03em]">
      <span className="text-muted">{icon}</span>
      {title}
      {count > 0 && <span className="text-base font-normal tabular-nums text-muted">{count}</span>}
    </h2>
  );
}

function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-10 text-center shadow-card">
      <p className="text-sm text-muted">{text}</p>
      {cta && href && (
        <Link
          href={href}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
