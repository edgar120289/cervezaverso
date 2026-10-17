"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FormMessage from "@/components/FormMessage";

const BUTTON_CLASS =
  "flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-5 py-3 font-semibold transition-colors hover:bg-canvas active:scale-[0.98] disabled:opacity-60";

/** Inicio de sesión con Google (Supabase Auth); el retorno pasa por /auth/callback. */
export default function SocialLoginButtons({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setLoading(false);
      setError("No pudimos iniciar sesión con Google. Intenta de nuevo.");
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={signIn} disabled={loading} className={BUTTON_CLASS}>
        <GoogleIcon />
        {loading ? "Conectando…" : "Continuar con Google"}
      </button>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div className="flex items-center gap-3 pt-1 text-sm text-muted" aria-hidden>
        <span className="h-px flex-1 bg-black/10" />o
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
