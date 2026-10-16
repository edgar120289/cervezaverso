"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { solicitarRecuperacion } from "@/app/actions/auth";
import { firstIssue, isHoneypotFilled, recoverSchema } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";
import Turnstile, { TURNSTILE_ENABLED } from "@/components/Turnstile";
import FormField, { INPUT_CLASS } from "@/components/FormField";
import FormMessage from "@/components/FormMessage";
import PrivacyNotice from "@/components/PrivacyNotice";

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailId = useId();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isHoneypotFilled(honeypot)) return;

    const parsed = recoverSchema.safeParse({ email, website: honeypot, turnstileToken });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    if (TURNSTILE_ENABLED && !turnstileToken) {
      return setError("Espera un momento a que terminemos de verificar tu navegador.");
    }

    setIsLoading(true);
    try {
      const result = await solicitarRecuperacion(parsed.data);
      if (!result.ok) return setError(result.error);
      setSent(true);
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      setTurnstileReset((n) => n + 1);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[28px] bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">Recupera tu contraseña</h1>
        <p className="mt-1 text-sm text-muted">Te enviaremos un enlace para crear una contraseña nueva.</p>

        {sent ? (
          <div className="mt-6">
            <FormMessage tone="info">
              Si hay una cuenta con ese correo, recibirás el enlace en unos minutos. Revisa también la carpeta de spam.
            </FormMessage>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="relative mt-6 space-y-3">
            <Honeypot value={honeypot} onChange={setHoneypot} />
            <FormField id={emailId} label="Correo electrónico">
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
            <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
            {error && <FormMessage tone="error">{error}</FormMessage>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? "Enviando…" : "Enviar enlace"}
            </button>
            <PrivacyNotice className="px-2">Usamos tu correo sólo para enviarte el enlace de recuperación.</PrivacyNotice>
          </form>
        )}

        <Link href="/login" className="mx-auto mt-4 flex min-h-11 w-fit items-center text-sm text-muted hover:text-black">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
