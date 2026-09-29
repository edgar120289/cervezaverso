import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { createClient } from "@/lib/supabase/server";
import type { Direccion } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let direcciones: Direccion[] = [];
  if (user) {
    const { data } = await supabase
      .from("direcciones")
      .select("id, nombre_completo, telefono, calle, colonia, ciudad, estado, codigo_postal, referencias, predeterminada")
      .order("predeterminada", { ascending: false })
      .order("created_at", { ascending: false });
    direcciones = data ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Finalizar compra</h1>
      <CheckoutForm email={user?.email ?? ""} direcciones={direcciones} isLoggedIn={Boolean(user)} />
    </div>
  );
}
