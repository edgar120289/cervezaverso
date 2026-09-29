import type { Metadata } from "next";
import RecoverPasswordForm from "@/components/RecoverPasswordForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return <RecoverPasswordForm />;
}
