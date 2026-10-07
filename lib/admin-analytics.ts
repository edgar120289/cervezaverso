import "server-only";
import { createClient } from "@/lib/supabase/server";
import { TRIBUS } from "@/lib/tribus";

/** Pedidos con el dinero ya cobrado: excluye Pendiente y Cancelado. */
const ESTADOS_COBRADOS = ["Pagado", "Enviado", "Entregado"];

/** Inicio del mes actual en hora de Ciudad de México (UTC-6 fijo desde 2022), en ISO. */
function inicioDeMes(): string {
  const local = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1, 6)).toISOString();
}

export type TopCerveza = { sku: string; nombre: string; botellas: number };
export type TribuConteo = { id: string; label: string; total: number };

export type DashboardData = {
  pendientes: number;
  ventasMes: number;
  pedidosMes: number;
  ticketPromedio: number;
  clientes: number;
  top: TopCerveza[];
  tribus: TribuConteo[];
  sinTribu: number;
  error: string | null;
};

/** Todas las consultas corren en paralelo; los conteos usan `head` para no traer filas. */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const desde = inicioDeMes();

  const [pendientesRes, ventasRes, clientesRes, topRes, ...tribusRes] = await Promise.all([
    supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("estado", "Pendiente"),
    supabase.from("pedidos").select("total").in("estado", ESTADOS_COBRADOS).gte("fecha", desde),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
    supabase.rpc("top_cervezas_vendidas", { p_limit: 3 }),
    ...TRIBUS.map((t) =>
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client").eq("avatar_team", t.id)
    ),
  ]);

  const ventas = (ventasRes.data ?? []).map((p) => Number(p.total));
  const ventasMes = ventas.reduce((sum, total) => sum + total, 0);
  const pedidosMes = ventas.length;

  const top: TopCerveza[] = (topRes.data ?? []).map((row: { sku: string; nombre: string; botellas: number }) => ({
    sku: row.sku,
    nombre: row.nombre,
    botellas: Number(row.botellas),
  }));

  const tribus = TRIBUS.map((t, i) => ({ id: t.id, label: t.label, total: tribusRes[i].count ?? 0 })).sort(
    (a, b) => b.total - a.total
  );
  const clientes = clientesRes.count ?? 0;
  const conTribu = tribus.reduce((sum, t) => sum + t.total, 0);

  const failed = [pendientesRes, ventasRes, clientesRes, topRes, ...tribusRes].find((r) => r.error);

  return {
    pendientes: pendientesRes.count ?? 0,
    ventasMes,
    pedidosMes,
    ticketPromedio: pedidosMes > 0 ? ventasMes / pedidosMes : 0,
    clientes,
    top,
    tribus,
    sinTribu: Math.max(clientes - conTribu, 0),
    error: failed?.error?.message ?? null,
  };
}
