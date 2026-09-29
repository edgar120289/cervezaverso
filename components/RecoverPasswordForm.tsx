"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { firstIssue, isHoneypotFilled } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";

const emailSchema = z.email("Escribe un correo electrónico válido.").trim().toLowerCase();

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isHoneypotFilled(honeypot)) return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/callback?next=/recuperar/nueva`,
      });
      if (resetError) throw resetError;
      // Mismo mensaje exista o no la cuenta: no revela qué correos están registrados.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[28px] bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">Recupera tu contraseña</h1>
        <p className="mt-1 text-sm text-black/50">
          Te enviaremos un enlace para crear una contraseña nueva.
        </p>

        {sent ? (
          <p className="mt-6 rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/70">
            Si hay una cuenta con ese correo, recibirás el enlace en unos minutos. Revisa también la carpeta de spam.
          </p>
        ) : (
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
            {error && <p className="px-2 text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[#5433eb] py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-4 block text-center text-sm text-black/50 hover:text-black/80">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
