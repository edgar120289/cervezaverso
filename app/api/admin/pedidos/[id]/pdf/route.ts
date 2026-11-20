import { z } from "zod";
import { isAdminSession } from "@/lib/admin-auth";
import { respuestaPdfPedido } from "@/lib/pdf/respuesta";

/** PDF del pedido para el panel (solo admins). `?descargar=1` lo baja como archivo. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("No encontrado", { status: 404 });
  if (!(await isAdminSession())) return new Response("No autorizado", { status: 401 });
  return respuestaPdfPedido(id, new URL(req.url).searchParams.get("descargar") === "1");
}
