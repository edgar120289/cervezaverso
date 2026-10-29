"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { cuentaMeta, metaConfigurado } from "@/lib/meta";
import { publicacionSchema, REDES_BUCKET, type PublicacionInput } from "@/lib/redes";
import { SITE } from "@/lib/site";
import { firstIssue } from "@/lib/validation";

export type RedesResult = { ok: true; id?: string } | { ok: false; error: string };

function bucketPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${REDES_BUCKET}/`;
}

/** Solo imágenes nuestras: el bucket «redes» o /redes/ del sitio (Instagram las descarga por URL). */
function imagenPermitida(url: string) {
  return url.startsWith(bucketPrefix()) || url.startsWith(`${SITE.url}/redes/`);
}

/** Crea o edita una publicación. Guardar siempre la deja en borrador salvo que se pida aprobarla. */
export async function guardarPublicacion(input: PublicacionInput, aprobar: boolean): Promise<RedesResult> {
  const supabase = await requireAdmin("/admin/redes");
  const parsed = publicacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { id, ...data } = parsed.data;
  if (!data.imagenes.every(imagenPermitida)) return { ok: false, error: "Las imágenes deben subirse desde este panel." };
  if (aprobar && data.imagenes.length === 0) return { ok: false, error: "Agrega al menos una imagen antes de aprobar." };

  const fila = { ...data, estado: aprobar ? "aprobada" : "borrador", error: null, updated_at: new Date().toISOString() };
  const query = id
    ? supabase.from("redes_publicaciones").update(fila).eq("id", id).in("estado", ["borrador", "aprobada", "error"]).select("id")
    : supabase.from("redes_publicaciones").insert(fila).select("id");
  const { data: saved, error } = await query;
  if (error) return { ok: false, error: error.message };
  if (!saved?.length) return { ok: false, error: "No se pudo guardar: ya se está publicando o ya se publicó." };
  refresh();
  return { ok: true, id: saved[0].id };
}

/** Aprobar / regresar a borrador sin cambiar nada más. */
export async function cambiarEstadoPublicacion(id: string, estado: "borrador" | "aprobada"): Promise<RedesResult> {
  const supabase = await requireAdmin("/admin/redes");
  if (estado === "aprobada") {
    const { data } = await supabase.from("redes_publicaciones").select("imagenes").eq("id", id).maybeSingle();
    if (!data?.imagenes?.length) return { ok: false, error: "Agrega al menos una imagen antes de aprobar." };
  }
  const { data, error } = await supabase
    .from("redes_publicaciones")
    .update({ estado, error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("estado", ["borrador", "aprobada", "error"])
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Ya se está publicando o ya se publicó." };
  refresh();
  return { ok: true };
}

/** Aprueba y la programa para ya: sale en la siguiente vuelta (máx. 15 min). */
export async function publicarAhora(id: string): Promise<RedesResult> {
  const supabase = await requireAdmin("/admin/redes");
  const { data, error } = await supabase
    .from("redes_publicaciones")
    .update({ estado: "aprobada", programada_para: new Date().toISOString(), error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("estado", ["borrador", "aprobada", "error"])
    .neq("imagenes", "{}")
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "No se pudo: sin imágenes, o ya se publicó." };
  refresh();
  return { ok: true };
}

export async function borrarPublicacion(id: string): Promise<RedesResult> {
  const supabase = await requireAdmin("/admin/redes");
  const { data, error } = await supabase
    .from("redes_publicaciones")
    .delete()
    .eq("id", id)
    .neq("estado", "publicando")
    .select("imagenes");
  if (error) return { ok: false, error: error.message };
  const prefix = bucketPrefix();
  const paths = (data?.[0]?.imagenes ?? [])
    .filter((url: string) => url.startsWith(prefix))
    .map((url: string) => decodeURIComponent(url.slice(prefix.length)));
  if (paths.length > 0) await supabase.storage.from(REDES_BUCKET).remove(paths);
  refresh();
  return { ok: true };
}

export type EstadoMeta = { configurado: false } | { configurado: true; ok: true; pagina: string; instagram: string | null } | { configurado: true; ok: false; error: string };

/** Para el aviso de conexión del panel. */
export async function estadoMeta(): Promise<EstadoMeta> {
  await requireAdmin("/admin/redes");
  if (!metaConfigurado()) return { configurado: false };
  try {
    const cuenta = await cuentaMeta();
    return { configurado: true, ok: true, pagina: cuenta.pageName, instagram: cuenta.igUsername };
  } catch (err) {
    return { configurado: true, ok: false, error: err instanceof Error ? err.message : "Error desconocido." };
  }
}
