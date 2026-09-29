import type { Metadata } from "next";
import { Gift, TicketPercent } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMXN, formatPromoValue } from "@/lib/pricing";
import { formatFecha } from "@/lib/pedidos";
import type { PromoCode } from "@/lib/types";
import PromoCreateForm from "@/components/admin/PromoCreateForm";
import PromoToggleButton from "@/components/admin/PromoToggleButton";

export const metadata: Metadata = { title: "Cupones" };

export default async function AdminCuponesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("id, code, discount_type, value, min_purchase, active, max_uses, times_used, created_at")
    .order("created_at", { ascending: false });
  const cupones = (data ?? []) as PromoCode[];

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
      <PromoCreateForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Códigos</h2>

        {error ? (
          <div className="rounded-[28px] bg-white p-6 text-sm text-danger shadow-card">
            No se pudieron cargar los cupones: {error.message}
            {error.code === "42P01" || error.message.includes("promo_codes")
              ? " — ¿Ya corriste supabase/migrations/004_promo_codes.sql?"
              : ""}
          </div>
        ) : cupones.length === 0 ? (
          <div className="rounded-[28px] bg-white p-10 text-center text-sm text-muted shadow-card">
            Todavía no hay cupones. Crea el primero con el formulario.
          </div>
        ) : (
          <ul className="space-y-3">
            {cupones.map((cupon) => {
              const Icon = cupon.discount_type === "fixed" ? Gift : TicketPercent;
              const agotado = cupon.max_uses !== null && cupon.times_used >= cupon.max_uses;
              return (
                <li
                  key={cupon.id}
                  className={`flex flex-wrap items-center gap-4 rounded-[28px] bg-white px-6 py-4 shadow-card ${
                    cupon.active ? "" : "opacity-60"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-canvas text-black/60">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold tracking-wide">
                      {cupon.code}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-normal ${
                          !cupon.active
                            ? "bg-black/5 text-muted"
                            : agotado
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {!cupon.active ? "Inactivo" : agotado ? "Agotado" : "Activo"}
                      </span>
                    </p>
                    <p className="text-sm text-muted">
                      {formatPromoValue({ discount_type: cupon.discount_type, value: Number(cupon.value) })} de
                      descuento
                      {Number(cupon.min_purchase) > 0 && ` · mínimo ${formatMXN(Number(cupon.min_purchase))}`}
                    </p>
                    <p className="text-xs text-muted">
                      Usado {cupon.times_used}
                      {cupon.max_uses !== null ? ` de ${cupon.max_uses}` : ""}{" "}
                      {cupon.times_used === 1 ? "vez" : "veces"} · creado {formatFecha(cupon.created_at)}
                    </p>
                  </div>
                  <PromoToggleButton id={cupon.id} active={cupon.active} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
