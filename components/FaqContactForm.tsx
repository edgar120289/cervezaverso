"use client";

import { useId, useState, type FormEvent } from "react";
import { enviarConsulta } from "@/app/actions/contacto";
import { useAccount } from "@/lib/account-context";
import { contactSchema, firstIssue, isHoneypotFilled, MAX_CONSULTA } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";
import Turnstile, { TURNSTILE_ENABLED } from "@/components/Turnstile";
import FormField, { INPUT_CLASS } from "@/components/FormField";
import FormMessage from "@/components/FormMessage";
import PrivacyNotice from "@/components/PrivacyNotice";

/** Consulta por correo: con sesión el correo se toma de la cuenta (en el servidor); visitantes lo escriben. */
export default function FaqContactForm() {
  const { user } = useAccount();
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailId = useId();
  const messageId = useId();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isHoneypotFilled(honeypot)) return;

    const parsed = contactSchema.safeParse({ email: user ? "" : email, mensaje, website: honeypot, turnstileToken });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    if (!user && !parsed.data.email) return setError("Escribe tu correo electrónico para que podamos responderte.");
    if (TURNSTILE_ENABLED && !turnstileToken) {
      return setError("Espera un momento a que terminemos de verificar tu navegador.");
    }

    setIsLoading(true);
    try {
      const result = await enviarConsulta(parsed.data);
      if (!result.ok) return setError(result.error);
      setSent(true);
      setMensaje("");
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      setTurnstileReset((n) => n + 1);
    }
  }

  if (sent) {
    return (
      <FormMessage tone="info">
        ¡Gracias! Recibimos tu consulta y te responderemos por correo de lunes a domingo, de 9:00 a 21:00.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative space-y-3">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      {!user && (
        <FormField id={emailId} label="Tu correo electrónico">
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
      )}
      <FormField id={messageId} label="Tu duda">
        <textarea
          id={messageId}
          name="mensaje"
          required
          rows={5}
          maxLength={MAX_CONSULTA}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full rounded-[28px] bg-canvas px-5 py-3.5 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
        />
      </FormField>
      <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-11 w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {isLoading ? "Enviando…" : "Enviar consulta"}
      </button>
      <PrivacyNotice className="px-2">Usamos tu correo solo para responder tu consulta.</PrivacyNotice>
    </form>
  );
}
