import { createClient } from "@/lib/supabase/server";
import { formatMXN } from "@/lib/pricing";
import { tribuLabel } from "@/lib/tribus";

// Pedidos con el dinero ya cobrado: excluye Pendiente (sin pago) y Cancelado.
const ESTADOS_LTV = ["Pagado", "Enviado", "Entregado"];

type Cliente = { id: string; email: string; avatar_team: string | null; bottle_count: number };

export default async function AdminClientesPage() {
  const supabase = await createClient();
  // RLS: los admins ven todos los perfiles y pedidos (is_admin()).
  const [clientesRes, pedidosRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, avatar_team, bottle_count")
      .eq("role", "client")
      .order("created_at", { ascending: false }),
    supabase.from("pedidos").select("user_id, total").in("estado", ESTADOS_LTV).not("user_id", "is", null),
  ]);

  const error = clientesRes.error ?? pedidosRes.error;
  const clientes = (clientesRes.data ?? []) as Cliente[];
  const ltv = new Map<string, number>();
  for (const pedido of pedidosRes.data ?? []) {
    ltv.set(pedido.user_id, (ltv.get(pedido.user_id) ?? 0) + Number(pedido.total));
  }

  if (error) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
        No se pudieron cargar los clientes: {error.message}
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
        Todavía no hay clientes registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[28px] bg-white shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Clientes registrados</caption>
        <thead className="text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-6 py-4">Correo</th>
            <th scope="col" className="px-6 py-4">Team</th>
            <th scope="col" className="px-6 py-4 text-right">Botellas compradas</th>
            <th scope="col" className="px-6 py-4 text-right">LTV</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="border-t border-black/5">
              <td className="max-w-[280px] truncate px-6 py-4 font-semibold">{cliente.email}</td>
              <td className="px-6 py-4">{tribuLabel(cliente.avatar_team)}</td>
              <td className="px-6 py-4 text-right tabular-nums">{cliente.bottle_count}</td>
              <td className="px-6 py-4 text-right font-semibold tabular-nums">
                {formatMXN(ltv.get(cliente.id) ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
