import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/SignOutButton";

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
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Panel de Administración</h1>
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <AdminNav />
        <div className="ml-auto">
          <SignOutButton variant="outline" />
        </div>
      </div>
      {children}
    </div>
  );
}
