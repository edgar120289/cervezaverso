"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Regresa en el historial para conservar los filtros de la lista (viven en la URL).
 * Si la página se abrió directo (sin historial previo), cae a `fallbackHref`.
 */
export default function BackButton({ fallbackHref, children }: { fallbackHref: string; children: React.ReactNode }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-black"
    >
      <ArrowLeft size={16} />
      {children}
    </button>
  );
}
