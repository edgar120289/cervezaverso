import { z } from "zod";
import { verificarEnlacePdf } from "@/lib/pedido-share";
import { respuestaPdfPedido } from "@/lib/pdf/respuesta";

/** PDF de solo lectura con enlace firmado y con vencimiento (botón «Compartir» del panel). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  if (!z.uuid().safeParse(id).success || !verificarEnlacePdf(id, url.searchParams.get("exp"), url.searchParams.get("sig"))) {
    return new Response("Este enlace no es válido o ya venció.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return respuestaPdfPedido(id, url.searchParams.get("descargar") === "1");
}
