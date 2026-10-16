import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Crea tu cuenta" };

export default async function RegistroPage({ searchParams }: PageProps<"/registro">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);

  return <LoginForm next={nextPath} initialMode="signup" />;
}
