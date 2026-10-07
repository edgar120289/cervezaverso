import Link from "next/link";
import { formatMXN } from "@/lib/pricing";
import type { DashboardData } from "@/lib/admin-analytics";

function Kpi({
  label,
  value,
  hint,
  href,
  alert = false,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[28px] p-5 shadow-card transition-transform active:scale-[0.98] ${
        alert ? "bg-danger text-white" : "bg-white hover:bg-white/70"
      }`}
    >
      <p className={`text-sm ${alert ? "text-white/80" : "text-muted"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
      <p className={`mt-1 text-xs ${alert ? "text-white/80" : "text-muted"}`}>{hint}</p>
    </Link>
  );
}

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const ancho = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold">{label}</span>
        <span className="shrink-0 tabular-nums text-muted">
          {value} {suffix}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-canvas" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${ancho}%` }} />
      </div>
    </li>
  );
}

export default function DashboardInsights({ data }: { data: DashboardData }) {
  const maxTop = data.top[0]?.botellas ?? 0;
  const maxTribu = data.tribus[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      {data.error && (
        <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm text-danger">
          No pudimos cargar toda la analítica: {data.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Pedidos pendientes"
          value={String(data.pendientes)}
          hint={data.pendientes > 0 ? "Requieren atención" : "Todo al día"}
          href="/admin/pedidos?estado=Pendiente"
          alert={data.pendientes > 0}
        />
        <Kpi
          label="Ventas del mes"
          value={formatMXN(data.ventasMes)}
          hint={`${data.pedidosMes} ${data.pedidosMes === 1 ? "pedido cobrado" : "pedidos cobrados"}`}
          href="/admin/pedidos?estado=Pagado"
        />
        <Kpi
          label="Ticket promedio"
          value={formatMXN(data.ticketPromedio)}
          hint="Ventas del mes ÷ pedidos cobrados"
          href="/admin/pedidos"
        />
        <Kpi label="Total de clientes" value={String(data.clientes)} hint="Ver clientes" href="/admin/clientes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="top-cervezas" className="space-y-4 rounded-[28px] bg-white p-6 shadow-card">
          <h2 id="top-cervezas" className="text-lg font-semibold tracking-tight">
            Top 3 cervezas más vendidas
          </h2>
          {data.top.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay pedidos cobrados.</p>
          ) : (
            <ol className="space-y-4">
              {data.top.map((cerveza, i) => (
                <Bar
                  key={cerveza.sku}
                  label={`${i + 1}. ${cerveza.nombre}`}
                  value={cerveza.botellas}
                  max={maxTop}
                  suffix="botellas"
                />
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="tribus" className="space-y-4 rounded-[28px] bg-white p-6 shadow-card">
          <h2 id="tribus" className="text-lg font-semibold tracking-tight">
            Distribución de tribus
          </h2>
          <ul className="space-y-4">
            {data.tribus.map((tribu) => (
              <Bar
                key={tribu.id}
                label={tribu.label}
                value={tribu.total}
                max={maxTribu}
                suffix={tribu.total === 1 ? "cliente" : "clientes"}
              />
            ))}
          </ul>
          <p className="text-xs text-muted">{data.sinTribu} clientes aún sin tribu.</p>
        </section>
      </div>
    </div>
  );
}
