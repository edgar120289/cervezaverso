"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { cambiarActivoProducto, eliminarProducto } from "@/app/actions/admin-productos";

type ProductRowActionsProps = {
  id: string;
  name: string;
  isActive: boolean;
  /** `card` reparte los botones a todo el ancho (móvil); `row` los deja compactos (tabla). */
  layout: "card" | "row";
};

/** Editar, activar/desactivar (ocultar sin borrar) y borrar: todo a un toque. */
export default function ProductRowActions({ id, name, isActive, layout }: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "No se pudo completar la acción.");
    });
  }

  function handleToggle() {
    run(() => cambiarActivoProducto(id, !isActive));
  }

  function handleDelete() {
    if (!window.confirm(`¿Borrar “${name}” y sus imágenes? Esta acción no se puede deshacer. Si solo quieres ocultarla, desactívala.`)) return;
    run(() => eliminarProducto(id));
  }

  const base =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";
  const grow = layout === "card" ? "flex-1" : "";

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${layout === "card" ? "" : "justify-end"}`}>
        <Link href={`/admin/productos/${id}`} className={`${base} ${grow} bg-canvas hover:bg-black hover:text-white`}>
          <Pencil size={14} aria-hidden />
          Editar
        </Link>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isActive}
          aria-label={`${isActive ? "Desactivar" : "Activar"} ${name}`}
          className={`${base} ${grow} ${isActive ? "bg-canvas hover:bg-black hover:text-white" : "bg-accent text-white hover:brightness-110"}`}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : isActive ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
          {isActive ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Borrar ${name}`}
          className={`${base} ${grow} bg-canvas text-danger hover:bg-danger hover:text-white`}
        >
          <Trash2 size={14} aria-hidden />
          Borrar
        </button>
      </div>
      {error && (
        <p role="alert" className="px-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
