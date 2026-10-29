import type { Metadata } from "next";
import { CircleAlert, CircleCheck } from "lucide-react";
import { estadoMeta } from "@/app/actions/admin-redes";
import { requireAdmin } from "@/lib/admin-auth";
import { PUBLICACION_COLUMNS, type Publicacion } from "@/lib/redes";
import RedesBoard from "@/components/admin/RedesBoard";

export const metadata: Metadata = { title: "Redes" };

export default async function AdminRedesPage() {
  const supabase = await requireAdmin("/admin/redes");
  const [{ data, error }, meta] = await Promise.all([
    supabase.from("redes_publicaciones").select(PUBLICACION_COLUMNS).order("programada_para", { ascending: true }),
    estadoMeta(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Redes</h2>
          <p className="max-w-2xl text-sm text-muted">
            Publicaciones para Instagram y Facebook. Las que apruebes salen solas a su hora (se revisa cada 15 minutos).
            Los borradores no se publican.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            meta.configurado && meta.ok ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"
          }`}
        >
          {meta.configurado && meta.ok ? <CircleCheck size={16} aria-hidden /> : <CircleAlert size={16} aria-hidden />}
          {!meta.configurado
            ? "Meta sin conectar: falta META_ACCESS_TOKEN en Vercel"
            : meta.ok
              ? `Conectado: ${meta.pagina}${meta.instagram ? ` · @${meta.instagram}` : " · sin Instagram ligado"}`
              : `Error con Meta: ${meta.error}`}
        </div>
      </div>
      {error ? (
        <p className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">No se pudieron cargar: {error.message}</p>
      ) : (
        <RedesBoard publicaciones={(data ?? []) as Publicacion[]} />
      )}
    </div>
  );
}
