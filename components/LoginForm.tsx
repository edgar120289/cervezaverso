"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema, firstIssue, isHoneypotFilled } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";

type Mode = "signin" | "signup";

export default function LoginForm({ next, notice: initialNotice }: { next: string; notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Un bot llenó el campo trampa: se descarta sin avisarle.
    if (isHoneypotFilled(honeypot)) return;

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }
    const credentials = parsed.data;

    setIsLoading(true);
    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          // El proyecto no exige confirmar el correo: la sesión ya está activa.
          router.push(next);
          router.refresh();
          return;
        }
        setNotice("Cuenta creada. Revisa tu correo y abre el enlace para confirmar tu registro.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      router.push(profile?.role === "admin" && next === "/cuenta" ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[28px] bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <p className="mt-1 text-sm text-black/50">
          Guarda tus favoritas, consulta tus pedidos y compra en 1 clic.
        </p>

        <form onSubmit={handleSubmit} noValidate className="relative mt-6 space-y-3">
          <Honeypot value={honeypot} onChange={setHoneypot} />
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full bg-[#f2f4f5] px-5 py-3.5 outline-none focus:ring-2 focus:ring-black/15"
          />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full bg-[#f2f4f5] px-5 py-3.5 outline-none focus:ring-2 focus:ring-black/15"
          />

          <div className="flex items-center justify-between gap-3 px-2 text-sm">
            <label className="flex cursor-pointer select-none items-center gap-2 text-black/60">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded accent-[#5433eb]"
              />
              Mostrar contraseña
            </label>
            {mode === "signin" && (
              <Link href="/recuperar" className="font-semibold text-black/60 hover:text-black">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>

          {error && <p className="px-2 text-sm text-red-500">{error}</p>}
          {notice && (
            <p className="rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/70">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#5433eb] py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? "Cargando…" : mode === "signin" ? "Entrar" : "Registrarme"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-black/50 hover:text-black/80"
        >
          {mode === "signin"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>

        <Link
          href="/"
          className="mt-2 block text-center text-xs text-black/30 hover:text-black/60"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
