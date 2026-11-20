import "server-only";
import { z } from "zod";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { procesarPedidoPagado } from "@/lib/lealtad-server";
import { LINKED_ORDERS_COOKIE } from "@/lib/linked-orders";

const resultadoSchema = z.object({
  ligados: z.number().int().min(0),
  por_acreditar: z.array(z.uuid()),
});

/**
 * Pasa a la cuenta los pedidos de invitado con el mismo correo (solo con el correo confirmado; lo
 * revisa la función SQL) y acredita las botellas de los cobrados que aún no las tenían. Es
 * idempotente: un pedido ya ligado no se vuelve a ligar y `acreditar_botellas` no acredita dos veces.
 * Si ligó algo, deja la cookie del aviso «Encontramos X pedidos tuyos…». Nunca lanza.
 */
export async function ligarPedidosInvitado(userId: string): Promise<{ ligados: number; botellas: number }> {
  const vacio = { ligados: 0, botellas: 0 };
  try {
    const { data, error } = await createAdminClient().rpc("ligar_pedidos_invitado", { p_user_id: userId });
    if (error) {
      console.error("[pedidos-invitado] Error al ligar pedidos:", error.message);
      return vacio;
    }
    const parsed = resultadoSchema.safeParse(data);
    if (!parsed.success || parsed.data.ligados === 0) return vacio;

    let botellas = 0;
    for (const pedidoId of parsed.data.por_acreditar) botellas += await procesarPedidoPagado(pedidoId);

    const cookieStore = await cookies();
    cookieStore.set(LINKED_ORDERS_COOKIE, `${parsed.data.ligados}.${botellas}`, {
      path: "/",
      maxAge: 60 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // La lee y la borra el aviso del navegador; solo lleva dos números.
      httpOnly: false,
    });
    return { ligados: parsed.data.ligados, botellas };
  } catch (err) {
    console.error("[pedidos-invitado] Error inesperado:", err instanceof Error ? err.message : err);
    return vacio;
  }
}
