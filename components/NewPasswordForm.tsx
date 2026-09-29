"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema, firstIssue } from "@/lib/validation";

const passwordSchema = credentialsSchema.shape.password;

export default function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password: parsed.data });
      if (updateError) throw updateError;
      router.push("/cuenta");
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
        <h1 className="text-2xl font-semibold tracking-tight">Crea una contraseña nueva</h1>
        <p className="mt-1 text-sm text-black/50">Mínimo 6 caracteres.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full bg-[#f2f4f5] px-5 py-3.5 outline-none focus:ring-2 focus:ring-black/15"
          />
          <label className="flex cursor-pointer select-none items-center gap-2 px-2 text-sm text-black/60">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded accent-[#5433eb]"
            />
            Mostrar contraseña
          </label>
          {error && <p className="px-2 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#5433eb] py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
