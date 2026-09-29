import type { ReactNode } from "react";

/** Estilo único de campos de texto: píldora sobre Canvas Mist con foco visible. */
export const INPUT_CLASS =
  "w-full rounded-full bg-canvas px-5 py-3.5 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";

/** Etiqueta visible + campo + ayuda opcional ligada con `aria-describedby` por id. */
export default function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block px-2 text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="px-2 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
