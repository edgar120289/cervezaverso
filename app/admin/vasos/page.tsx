import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import VasoList, { type VasoRow } from "@/components/admin/VasoList";

export const metadata: Metadata = { title: "Vasos · Panel" };

export default async function AdminVasosPage() {
  // `vaso` y `vaso_origen` no son públicas (migración 027): se leen con service role tras validar al admin.
  await requireAdmin("/admin/vasos");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, country, style, image_url, vaso, vaso_origen")
    .eq("is_active", true)
    .eq("retirado", false)
    .order("name", { ascending: true });
  const rows = (data ?? []) as VasoRow[];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Vasos</h2>
        <p className="text-sm text-muted">
          El vaso en que se sirve cada cerveza activa. Lo que cambies aquí se guarda al instante y queda como elegido a mano.
        </p>
      </div>

      {error ? (
        <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
          No se pudieron cargar las cervezas: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
          No hay cervezas activas.
        </div>
      ) : (
        <VasoList rows={rows} />
      )}
    </section>
  );
}
