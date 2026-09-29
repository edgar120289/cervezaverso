import type { ReactNode } from "react";
import Link from "next/link";

/** Aviso de privacidad breve que acompaña a cada formulario (LFPDPPP). */
export default function PrivacyNotice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${className}`}>
      {children} Consulta el{" "}
      <Link href="/privacidad" className="underline underline-offset-2 hover:text-ink">
        Aviso de privacidad
      </Link>
      .
    </p>
  );
}
