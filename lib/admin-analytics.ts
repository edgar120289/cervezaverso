import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/types";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_ATRAS = 12;
/** Ciudad de México: UTC-6 fijo desde 2022. */
const CDMX_OFFSET_H = 6;
/** En el modelo el stock es un estado, no una cantidad: «poco stock» = «Pocas piezas» (1 a 5 piezas). */
const LOW_STOCK = "low_stock";

export type MesOpcion = { value: string; label: string };

/** Mes actual en CDMX como [año, mes 1-12]. */
function mesActual(): [number, number] {
  const local = new Date(Date.now() - CDMX_OFFSET_H * 60 * 60 * 1000);
  return [local.getUTCFullYear(), local.getUTCMonth() + 1];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Últimos 12 meses (el actual primero) para el selector. */
export function opcionesDeMes(): MesOpcion[] {
  const [year, month] = mesActual();
  return Array.from({ length: MESES_ATRAS }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    return { value: `${y}-${pad(m + 1)}`, label: `${MESES[m][0].toUpperCase()}${MESES[m].slice(1)} ${y}` };
  });
}

/** Valida `?mes=YYYY-MM` contra las opciones; si no es válido, usa el mes actual. */
export function resolverMes(raw: string | undefined): string {
  const opciones = opcionesDeMes();
  return opciones.find((o) => o.value === raw)?.value ?? opciones[0].value;
}

/** Límites [desde, hasta) del mes en ISO, a medianoche de CDMX. */
function limitesDeMes(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  return {
    desde: new Date(Date.UTC(y, m - 1, 1, CDMX_OFFSET_H)).toISOString(),
    hasta: new Date(Date.UTC(y, m, 1, CDMX_OFFSET_H)).toISOString(),
  };
}

export type ResumenData = {
  ventasMes: number;
  pedidosMes: number;
  ticketPromedio: number;
  clientes: number;
  inventario: { total: number; activos: number; inactivos: number; pocoStock: number };
  pedidosPorEstado: Record<EstadoPedido, number>;
  error: string | null;
};

/** Todas las consultas corren en paralelo; los conteos usan `head` para no traer filas. */
export async function getResumenData(mes: string): Promise<ResumenData> {
  const supabase = await createClient();
  const { desde, hasta } = limitesDeMes(mes);
  const count = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });

  const [ventasRes, clientesRes, totalRes, activosRes, pocoRes, ...estadosRes] = await Promise.all([
    supabase.rpc("ventas_periodo", { p_desde: desde, p_hasta: hasta }).single<{ ventas: number; pedidos: number }>(),
    count("users").eq("role", "client"),
    count("products"),
    count("products").eq("is_active", true),
    count("products").eq("is_active", true).eq("stock_status", LOW_STOCK),
    ...ESTADOS_PEDIDO.map((estado) => count("pedidos").eq("estado", estado)),
  ]);

  const ventasMes = Number(ventasRes.data?.ventas ?? 0);
  const pedidosMes = Number(ventasRes.data?.pedidos ?? 0);
  const total = totalRes.count ?? 0;
  const activos = activosRes.count ?? 0;

  const failed = [ventasRes, clientesRes, totalRes, activosRes, pocoRes, ...estadosRes].find((r) => r.error);

  return {
    ventasMes,
    pedidosMes,
    ticketPromedio: pedidosMes > 0 ? ventasMes / pedidosMes : 0,
    clientes: clientesRes.count ?? 0,
    inventario: { total, activos, inactivos: Math.max(total - activos, 0), pocoStock: pocoRes.count ?? 0 },
    pedidosPorEstado: Object.fromEntries(ESTADOS_PEDIDO.map((e, i) => [e, estadosRes[i].count ?? 0])) as Record<
      EstadoPedido,
      number
    >,
    error: failed?.error?.message ?? null,
  };
}
