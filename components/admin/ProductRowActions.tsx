"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { cambiarActivoProducto, eliminarProducto } from "@/app/actions/admin-productos";

type ProductRowActionsProps = {
  id: string;
  name: string;
  isActive: boolean;
  /**
   * `card` reparte los botones a todo el ancho de la tarjeta;
   * `header` omite "Editar" (ya se está en la edición) y manda a /admin tras borrar.
   */
  layout: "card" | "header";
};

/** Editar, activar/desactivar (ocultar sin borrar) y borrar: todo a un toque. */
export default function ProductRowActions({ id, name, isActive, layout }: ProductRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "No se pudo completar la acción.");
      else onSuccess?.();
    });
  }

  function handleToggle() {
    run(() => cambiarActivoProducto(id, !isActive));
  }

  function handleDelete() {
    if (!window.confirm(`¿Borrar “${name}” y sus imágenes? Esta acción no se puede deshacer. Si solo quieres ocultarla, desactívala.`)) return;
    run(
      () => eliminarProducto(id),
      layout === "header" ? () => router.replace("/admin") : undefined,
    );
  }

  const base =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";
  const grow = layout === "card" ? "flex-1" : "";
  const toggleLabel = isActive ? "Desactivar" : "Activar";

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap items-center gap-2 ${layout === "header" ? "justify-end" : ""}`}>
        {layout !== "header" && (
          <Link
            href={`/admin/productos/${id}`}
            title="Editar"
            className={`${base} ${grow} bg-canvas hover:bg-black hover:text-white`}
          >
            <Pencil size={14} aria-hidden />
            Editar
          </Link>
        )}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isActive}
          aria-label={`${toggleLabel} ${name}`}
          title={toggleLabel}
          className={`${base} ${grow} ${isActive ? "bg-canvas hover:bg-black hover:text-white" : "bg-accent text-white hover:brightness-110"}`}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : isActive ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
          {toggleLabel}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Borrar ${name}`}
          title="Borrar"
          className={`${base} ${grow} bg-canvas text-danger hover:bg-danger hover:text-white`}
        >
          <Trash2 size={14} aria-hidden />
          Borrar
        </button>
      </div>
      {error && (
        <p role="alert" className={`px-2 text-xs text-danger ${layout === "header" ? "text-right" : ""}`}>
          {error}
        </p>
      )}
    </div>
  );
}
