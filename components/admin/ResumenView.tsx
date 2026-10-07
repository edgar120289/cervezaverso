import Link from "next/link";
import { formatMXN } from "@/lib/pricing";
import { ESTADO_BADGE } from "@/lib/pedidos";
import { ESTADOS_PEDIDO } from "@/lib/types";
import type { ResumenData } from "@/lib/admin-analytics";

function Stat({
  label,
  value,
  hint,
  href,
  alert = false,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  alert?: boolean;
}) {
  const className = `block rounded-[28px] p-5 shadow-card ${alert ? "bg-danger text-white" : "bg-white"} ${
    href ? "transition-transform active:scale-[0.98]" : ""
  }`;
  const body = (
    <>
      <p className={`text-sm ${alert ? "text-white/80" : "text-muted"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
      {hint && <p className={`mt-1 text-xs ${alert ? "text-white/80" : "text-muted"}`}>{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function ResumenView({ data, mesLabel }: { data: ResumenData; mesLabel: string }) {
  const { inventario, pedidosPorEstado } = data;
  const pendientes = pedidosPorEstado.Pendiente;

  return (
    <div className="space-y-8">
      {data.error && (
        <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm text-danger">
          No pudimos cargar toda la analítica: {data.error}
        </p>
      )}

      <section aria-labelledby="ventas" className="space-y-4">
        <h2 id="ventas" className="text-lg font-semibold tracking-tight">
          Ventas · {mesLabel}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Ingresos" value={formatMXN(data.ventasMes)} hint="Pedidos Pagado, Enviado y Entregado" />
          <Stat
            label="Pedidos cobrados"
            value={String(data.pedidosMes)}
            hint={data.pedidosMes === 1 ? "pedido en el mes" : "pedidos en el mes"}
          />
          <Stat label="Ticket promedio" value={formatMXN(data.ticketPromedio)} hint="Ingresos ÷ pedidos cobrados" />
          <Stat label="Total de clientes" value={String(data.clientes)} hint="Ver clientes" href="/admin/clientes" />
        </div>
      </section>

      <section aria-labelledby="inventario" className="space-y-4">
        <h2 id="inventario" className="text-lg font-semibold tracking-tight">
          Resumen de Inventario
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total de productos" value={String(inventario.total)} href="/admin" />
          <Stat label="Activos" value={String(inventario.activos)} hint="Visibles en la tienda" href="/admin?estado=active" />
          <Stat label="Inactivos" value={String(inventario.inactivos)} hint="Ocultos al público" href="/admin?estado=inactive" />
          <Stat
            label="Poco stock"
            value={String(inventario.pocoStock)}
            hint="Activos con «Pocas piezas» (5 o menos)"
            href="/admin"
          />
        </div>
      </section>

      <section aria-labelledby="pedidos" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="pedidos" className="text-lg font-semibold tracking-tight">
            Resumen de Pedidos
          </h2>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-accent hover:underline">
            Ver todos los pedidos
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {ESTADOS_PEDIDO.map((estado) => {
            const alert = estado === "Pendiente" && pendientes > 0;
            return (
              <Link
                key={estado}
                href={`/admin/pedidos?estado=${estado}`}
                className={`rounded-[28px] p-5 shadow-card transition-transform active:scale-[0.98] ${
                  alert ? "bg-danger text-white" : "bg-white"
                }`}
              >
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    alert ? "bg-white/20 text-white" : ESTADO_BADGE[estado]
                  }`}
                >
                  {estado}
                </span>
                <p className="mt-3 text-2xl font-semibold tabular-nums tracking-[-0.03em]">{pedidosPorEstado[estado]}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
