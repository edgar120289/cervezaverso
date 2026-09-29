import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Inicia sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);
  const notice =
    error === "confirmacion"
      ? "El enlace de confirmación expiró o ya se usó. Inicia sesión o regístrate de nuevo."
      : undefined;

  return <LoginForm next={nextPath} notice={notice} />;
}
