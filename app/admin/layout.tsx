import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Panel de Administración</h1>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-black/50">
          <Link href="/admin" className="hover:text-black">Resumen</Link>
          <Link href="/admin/pedidos" className="hover:text-black">Pedidos</Link>
          <Link href="/admin/cupones" className="hover:text-black">Cupones</Link>
          <Link href="/admin/import" className="hover:text-black">Importar Excel</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
