import "server-only";
import { getPedidoCompleto } from "@/lib/pedido-admin";
import { nombreArchivoPdf, renderPedidoPdf } from "@/lib/pdf/pedido-pdf";

/** Respuesta HTTP con el PDF del pedido (inline para verlo, attachment para descargarlo). */
export async function respuestaPdfPedido(id: string, descargar: boolean): Promise<Response> {
  const data = await getPedidoCompleto(id);
  if (!data) return new Response("No encontrado", { status: 404 });
  const pdf = await renderPedidoPdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${nombreArchivoPdf(id)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
