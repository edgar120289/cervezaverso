"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FormMessage from "@/components/FormMessage";

type Provider = "google" | "apple";

const BUTTON_CLASS =
  "flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-5 py-3 font-semibold transition-colors hover:bg-canvas active:scale-[0.98] disabled:opacity-60";

/** Inicio de sesión con Google o Apple (Supabase Auth); el retorno pasa por /auth/callback. */
export default function SocialLoginButtons({ next }: { next: string }) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    setLoading(provider);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setLoading(null);
      setError("No pudimos iniciar sesión con ese proveedor. Intenta de nuevo.");
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <button type="button" onClick={() => signIn("google")} disabled={loading !== null} className={BUTTON_CLASS}>
        <GoogleIcon />
        {loading === "google" ? "Conectando…" : "Continuar con Google"}
      </button>
      <button type="button" onClick={() => signIn("apple")} disabled={loading !== null} className={BUTTON_CLASS}>
        <AppleIcon />
        {loading === "apple" ? "Conectando…" : "Continuar con Apple"}
      </button>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div className="flex items-center gap-3 pt-2 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-black/10" />o con tu correo
        <span className="h-px flex-1 bg-black/10" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.09A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.29a12 12 0 0 0 0 10.78l4-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.61l4 3.09C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3.01-.8.86-2.1 1.52-3.15 1.43-.13-1.1.43-2.25 1.15-3 .8-.84 2.18-1.46 3.2-1.44ZM20.5 17.3c-.55 1.26-.82 1.82-1.53 2.93-.99 1.55-2.39 3.48-4.12 3.5-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.76-4.04-3.31C-.07 15.9-.36 11.33 1.35 8.7c1.21-1.87 3.12-2.96 4.92-2.96 1.83 0 2.98 1.01 4.49 1.01 1.47 0 2.36-1.01 4.48-1.01 1.6 0 3.3.87 4.51 2.38-3.96 2.17-3.32 7.83.75 9.18Z" />
    </svg>
  );
}
