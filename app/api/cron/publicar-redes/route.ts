import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cuentaMeta,
  metaConfigurado,
  publicarFacebook,
  publicarHistoriaFacebook,
  publicarHistoriaInstagram,
  publicarInstagram,
  type MetaCuenta,
} from "@/lib/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Publicaciones por llamada: pg_cron llama cada 15 minutos. */
const POR_LLAMADA = 2;

type Fila = {
  id: string;
  titulo: string;
  caption: string;
  imagenes: string[];
  redes: string[];
  formato: string | null;
  ig_media_id: string | null;
  fb_post_id: string | null;
  intentos: number;
};

/**
 * Publica en Instagram y Facebook lo aprobado cuya hora ya llegó (/admin/redes). Es idempotente:
 * sin publicaciones vencidas no hace nada, así que no necesita secreto (la llaman pg_cron y Vercel Cron).
 * Si una red ya quedó publicada en un intento anterior, no se repite.
 */
export async function GET() {
  if (!metaConfigurado()) return NextResponse.json({ ok: true, publicadas: 0, nota: "Sin META_ACCESS_TOKEN." });
  const admin = createAdminClient();
  let cuenta: MetaCuenta | null = null;
  const resultados: { id: string; estado: string; error?: string }[] = [];

  for (let i = 0; i < POR_LLAMADA; i++) {
    const { data, error } = await admin.rpc("reclamar_publicacion_redes");
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const fila = (data as Fila[] | null)?.[0];
    if (!fila) break;

    const cambios: Record<string, unknown> = {};
    const errores: string[] = [];
    try {
      if (fila.imagenes.length === 0) throw new Error("La publicación no tiene imágenes.");
      cuenta ??= await cuentaMeta();
      if (fila.redes.includes("instagram") && !fila.ig_media_id) {
        try {
          cambios.ig_media_id =
            fila.formato === "historia"
              ? await publicarHistoriaInstagram(cuenta, fila.imagenes[0])
              : await publicarInstagram(cuenta, fila.imagenes, fila.caption);
        } catch (err) {
          errores.push(`Instagram: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      if (fila.redes.includes("facebook") && !fila.fb_post_id) {
        try {
          cambios.fb_post_id =
            fila.formato === "historia"
              ? await publicarHistoriaFacebook(cuenta, fila.imagenes[0])
              : await publicarFacebook(cuenta, fila.imagenes, fila.caption);
        } catch (err) {
          errores.push(`Facebook: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      errores.push(err instanceof Error ? err.message : String(err));
    }

    const estado = errores.length === 0 ? "publicada" : "error";
    const { error: guardarError } = await admin
      .from("redes_publicaciones")
      .update({
        ...cambios,
        estado,
        error: errores.join(" · ") || null,
        publicada_at: estado === "publicada" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fila.id);
    // Si no se guarda, la fila queda «publicando» y a los 30 min se reintentaría: hay que verlo en logs.
    if (guardarError) console.error("[redes] No se guardó el resultado de", fila.titulo, guardarError.message, cambios);
    if (errores.length > 0) console.error("[redes]", fila.titulo, errores.join(" · "));
    resultados.push({ id: fila.id, estado, ...(errores.length ? { error: errores.join(" · ") } : {}) });
  }

  return NextResponse.json({ ok: true, publicadas: resultados.filter((r) => r.estado === "publicada").length, resultados });
}
