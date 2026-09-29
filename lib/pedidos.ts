import type { EstadoPedido } from "@/lib/types";

export const ESTADO_BADGE: Record<EstadoPedido, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Pagado: "bg-black text-white",
  Enviado: "bg-sky-100 text-sky-800",
  Entregado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-black/5 text-black/50",
};

export function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

/** Folio corto y legible para el cliente (el id completo sigue siendo el UUID). */
export function folio(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// `*` en vez de la lista de columnas: incluye promo_code/descuento (migración 004)
// cuando existen, sin romper la página si la migración aún no se aplicó.
export const PEDIDO_DETALLE_COLUMNS =
  "*, pedido_items (id, product_id, sku, nombre, precio_unitario, cantidad, importe)";
