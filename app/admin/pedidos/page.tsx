import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMXN } from "@/lib/pricing";
import { ESTADO_BADGE, formatFecha } from "@/lib/pedidos";
import { ESTADOS_PEDIDO, type EstadoPedido, type Pedido } from "@/lib/types";

function isEstado(value: unknown): value is EstadoPedido {
  return typeof value === "string" && (ESTADOS_PEDIDO as readonly string[]).includes(value);
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { estado } = await searchParams;
  const estadoActivo = isEstado(estado) ? estado : null;

  const supabase = await createClient();
  let query = supabase
    .from("pedidos")
    .select("id, cliente_nombre, cliente_email, fecha, total, estado")
    .order("fecha", { ascending: false });
  if (estadoActivo) query = query.eq("estado", estadoActivo);

  const { data, error } = await query;
  const pedidos = (data ?? []) as Pedido[];

  const filtros: { label: string; href: string; activo: boolean }[] = [
    { label: "Todos", href: "/admin/pedidos", activo: estadoActivo === null },
    ...ESTADOS_PEDIDO.map((e) => ({
      label: e,
      href: `/admin/pedidos?estado=${e}`,
      activo: estadoActivo === e,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filtros.map((filtro) => (
          <Link
            key={filtro.label}
            href={filtro.href}
            aria-current={filtro.activo ? "page" : undefined}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98] ${
              filtro.activo
                ? "bg-black text-white"
                : "bg-white text-black shadow-card hover:bg-black/[0.03]"
            }`}
          >
            {filtro.label}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
          No se pudieron cargar los pedidos: {error.message}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          {estadoActivo
            ? `No hay pedidos con estado “${estadoActivo}”.`
            : "Todavía no hay pedidos."}
        </div>
      ) : (
        <ul className="space-y-3">
          <li className="hidden grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-6 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span>Cliente</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span className="text-right">Total</span>
          </li>
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className="grid grid-cols-2 items-center gap-x-4 gap-y-2 rounded-[28px] bg-white px-6 py-5 shadow-card sm:grid-cols-[2fr_1.5fr_1fr_1fr]"
            >
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="truncate font-semibold">{pedido.cliente_nombre}</p>
                <p className="truncate text-sm text-muted">{pedido.cliente_email}</p>
              </div>
              <p className="col-span-2 text-sm text-black/60 sm:col-span-1">
                {formatFecha(pedido.fecha)}
              </p>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[pedido.estado]}`}
              >
                {pedido.estado}
              </span>
              <p className="text-right font-semibold tabular-nums">
                {formatMXN(Number(pedido.total))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
