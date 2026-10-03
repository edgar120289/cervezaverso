"use client";

import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { cambiarDestacadoProducto } from "@/app/actions/admin-productos";

/** Estrella para destacar o quitar de destacados una cerveza; el cambio se guarda al instante. */
export default function FeaturedToggle({ id, name, isFeatured }: { id: string; name: string; isFeatured: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await cambiarDestacadoProducto(id, !isFeatured);
      if (!result.ok) setError(result.error);
    });
  }

  const label = isFeatured ? `Quitar ${name} de destacados` : `Destacar ${name}`;

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={isFeatured}
        aria-label={label}
        title={isFeatured ? "Quitar de destacados" : "Destacar"}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50 ${
          isFeatured ? "bg-accent text-white" : "bg-canvas text-black/70 hover:bg-black hover:text-white"
        }`}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Star size={16} aria-hidden fill={isFeatured ? "currentColor" : "none"} />
        )}
      </button>
      {error && (
        <p role="alert" className="sr-only">
          {error}
        </p>
      )}
    </div>
  );
}
