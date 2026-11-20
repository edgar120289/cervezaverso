/** Pagos de un pedido (migración 036): tipos y cálculos compartidos por el panel, el PDF y los correos. */

export const METODOS_PAGO_PEDIDO = ["mercadopago", "transferencia", "efectivo"] as const;
export type MetodoPagoPedido = (typeof METODOS_PAGO_PEDIDO)[number];

export const METODO_PAGO_LABEL: Record<MetodoPagoPedido, string> = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
};

export type EstadoPago = "pendiente" | "recibido";

export type PedidoPago = {
  id: string;
  metodo: MetodoPagoPedido;
  monto: number;
  estado: EstadoPago;
  es_original: boolean;
  referencia: string | null;
  fecha: string;
  recibido_at: string | null;
};

export type ResumenPagos = {
  recibido: number;
  pendiente: number;
  /** Total del pedido que no está cubierto por ningún pago registrado (positivo) o excedente (negativo). */
  sinRegistrar: number;
  pagoAdicionalPendiente: boolean;
};

const centavos = (n: number) => Math.round(n * 100);

export function resumirPagos(total: number, pagos: Pick<PedidoPago, "monto" | "estado">[]): ResumenPagos {
  const recibido = pagos.filter((p) => p.estado === "recibido").reduce((s, p) => s + centavos(Number(p.monto)), 0);
  const pendiente = pagos.filter((p) => p.estado === "pendiente").reduce((s, p) => s + centavos(Number(p.monto)), 0);
  return {
    recibido: recibido / 100,
    pendiente: pendiente / 100,
    sinRegistrar: (centavos(Number(total)) - recibido - pendiente) / 100,
    pagoAdicionalPendiente: pendiente > 0,
  };
}
