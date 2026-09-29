"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema, firstIssue } from "@/lib/validation";
import FormField, { INPUT_CLASS } from "@/components/FormField";
import FormMessage from "@/components/FormMessage";

const passwordSchema = credentialsSchema.shape.password;

export default function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const passwordId = useId();

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
      if (updateError) {
        console.error("[auth] No se pudo cambiar la contraseña:", updateError.code);
        setError(
          updateError.code === "same_password"
            ? "La contraseña nueva debe ser distinta de la anterior."
            : "No pudimos guardar tu contraseña. Abre de nuevo el enlace de tu correo e intenta otra vez."
        );
        return;
      }
      router.push("/cuenta");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[28px] bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">Crea una contraseña nueva</h1>
        <p className="mt-1 text-sm text-muted">Mínimo 6 caracteres.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
          <FormField id={passwordId} label="Nueva contraseña">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
          <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 px-2 text-sm text-black/65">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded accent-accent"
            />
            Mostrar contraseña
          </label>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
