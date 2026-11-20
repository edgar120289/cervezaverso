/** Cookie de un solo uso con «pedidos.botellas» que deja el servidor al ligar pedidos de invitado. */
export const LINKED_ORDERS_COOKIE = "cv_pedidos_ligados";

export type LinkedOrders = { ligados: number; botellas: number };

export function parseLinkedOrders(value: string | undefined | null): LinkedOrders | null {
  const match = value?.match(/^(\d{1,4})\.(\d{1,6})$/);
  if (!match) return null;
  const ligados = Number(match[1]);
  return ligados > 0 ? { ligados, botellas: Number(match[2]) } : null;
}

export function linkedOrdersMessage({ ligados, botellas }: LinkedOrders): string {
  const pedidos = ligados === 1 ? "1 pedido tuyo" : `${ligados} pedidos tuyos`;
  if (botellas <= 0) return `Encontramos ${pedidos} y lo${ligados === 1 ? "" : "s"} agregamos a tu cuenta.`;
  return `Encontramos ${pedidos} y sumamos ${botellas} ${botellas === 1 ? "botella" : "botellas"}.`;
}
