import type { ReactNode } from "react";

/** Mensaje de formulario anunciado por lectores de pantalla (error = alerta inmediata). */
export default function FormMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return tone === "error" ? (
    <p role="alert" className="px-2 text-sm text-danger">
      {children}
    </p>
  ) : (
    <p role="status" className="rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/80">
      {children}
    </p>
  );
}
