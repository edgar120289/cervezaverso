import Link from "next/link";
import type { ReactNode } from "react";
import type { HeroCta } from "@/lib/hero";

type CtaLinkProps = {
  cta: Pick<HeroCta, "text" | "url" | "is_external">;
  className: string;
  children?: ReactNode;
};

/** Botón de enlace de la landing: los externos (WhatsApp, redes, blogs) abren en pestaña nueva, salvo `tel:` y `mailto:`. */
export default function CtaLink({ cta, className, children }: CtaLinkProps) {
  if (/^(tel|mailto):/i.test(cta.url)) {
    return (
      <a href={cta.url} className={className}>
        {children ?? cta.text}
      </a>
    );
  }
  if (cta.is_external) {
    return (
      <a href={cta.url} target="_blank" rel="noopener noreferrer" className={className}>
        {children ?? cta.text}
        <span className="sr-only"> (se abre en una pestaña nueva)</span>
      </a>
    );
  }
  return (
    <Link href={cta.url} className={className}>
      {children ?? cta.text}
    </Link>
  );
}
