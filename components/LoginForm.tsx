"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { iniciarSesion, registrarCuenta } from "@/app/actions/auth";
import { credentialsSchema, birthDateSchema, firstIssue, isHoneypotFilled } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";
import Turnstile, { TURNSTILE_ENABLED } from "@/components/Turnstile";
import FormField, { INPUT_CLASS } from "@/components/FormField";
import FormMessage from "@/components/FormMessage";
import PrivacyNotice from "@/components/PrivacyNotice";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { SPAM_HINT } from "@/lib/site";

type Mode = "signin" | "signup";

export default function LoginForm({
  next,
  notice: initialNotice,
  initialMode = "signin",
}: {
  next: string;
  notice?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const ids = { email: useId(), password: useId(), birth: useId() };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Un bot llenó el campo trampa: se descarta sin avisarle.
    if (isHoneypotFilled(honeypot)) return;

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    if (mode === "signup") {
      const birth = birthDateSchema.safeParse(birthDate);
      if (!birth.success) return setError(firstIssue(birth.error));
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      return setError("Espera un momento a que terminemos de verificar tu navegador.");
    }

    setIsLoading(true);
    const common = { ...parsed.data, website: honeypot, turnstileToken };
    try {
      if (mode === "signup") {
        const result = await registrarCuenta({ ...common, fecha_nacimiento: birthDate, next });
        if (!result.ok) return setError(result.error);
        if (!result.needsConfirmation) return window.location.assign(next);
        setNotice(`Cuenta creada. Revisa tu correo y abre el enlace para confirmar tu registro. ${SPAM_HINT}`);
        return;
      }

      const result = await iniciarSesion(common);
      if (!result.ok) return setError(result.error);
      // Recarga completa: el header y los favoritos leen la sesión nueva desde las cookies.
      window.location.assign(result.role === "admin" && next === "/cuenta" ? "/admin" : next);
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      // Cada token de Turnstile sirve una sola vez.
      setTurnstileReset((n) => n + 1);
    }
  }

  function selectMode(value: Mode) {
    setMode(value);
    setError(null);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:py-16">
      <div className="rounded-[28px] bg-white p-6 shadow-card sm:p-8">
        <div role="tablist" aria-label="Acceso" className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1 text-sm font-semibold">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => selectMode(value)}
              className={`min-h-11 rounded-full transition-colors ${
                mode === value ? "bg-white shadow-card" : "text-muted hover:text-black"
              }`}
            >
              {value === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <p className="mt-1 text-sm text-muted">Guarda tus favoritas, consulta tus pedidos y compra en 1 clic.</p>

        <SocialLoginButtons next={next} />

        <form onSubmit={handleSubmit} noValidate className="relative mt-6 space-y-3">
          <Honeypot value={honeypot} onChange={setHoneypot} />
          <FormField id={ids.email} label="Correo electrónico">
            <input
              id={ids.email}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField id={ids.password} label="Contraseña">
            <input
              id={ids.password}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>

          {mode === "signup" && (
            <FormField
              id={ids.birth}
              label="Fecha de nacimiento"
              hint="La venta de bebidas alcohólicas es exclusiva para mayores de 18 años."
            >
              <input
                id={ids.birth}
                type="date"
                name="fecha_nacimiento"
                autoComplete="bday"
                required
                min="1900-01-01"
                aria-describedby={`${ids.birth}-hint`}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-sm">
            <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-black/65">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded accent-accent"
              />
              Mostrar contraseña
            </label>
            {mode === "signin" && (
              <Link href="/recuperar" className="flex min-h-11 items-center font-semibold text-black/65 hover:text-black">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>

          <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />

          {error && <FormMessage tone="error">{error}</FormMessage>}
          {notice && <FormMessage tone="info">{notice}</FormMessage>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? "Cargando…" : mode === "signin" ? "Entrar" : "Registrarme"}
          </button>

          <PrivacyNotice className="px-2">
            {mode === "signup"
              ? "Usamos tus datos para crear tu cuenta, verificar tu mayoría de edad y gestionar tus pedidos."
              : "Usamos tu correo para identificarte y proteger tu cuenta."}
          </PrivacyNotice>
        </form>

        <Link href="/" className="mx-auto mt-2 flex min-h-11 w-fit items-center text-xs text-muted hover:text-black">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
