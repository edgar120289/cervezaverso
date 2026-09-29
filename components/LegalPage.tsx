import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  /** Fecha visible de "Última actualización" (texto libre, p. ej. "25 de septiembre de 2026"). */
  updatedAt: string;
  sections: LegalSection[];
};

/**
 * Maqueta editorial para páginas legales: índice lateral fijo en escritorio y
 * columna de lectura de ~70 caracteres. Todo texto legal se publica como
 * borrador hasta que lo revise un especialista.
 */
export default function LegalPage({ eyebrow, title, intro, updatedAt, sections }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <header className="rounded-[28px] bg-white px-6 py-10 shadow-card sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
          {title}
        </h1>
        <div className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{intro}</div>
        <p className="mt-6 text-sm text-muted">Última actualización: {updatedAt}</p>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
        <nav
          aria-label="Contenido"
          className="rounded-[28px] bg-white p-5 shadow-card lg:sticky lg:top-28"
        >
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted">Contenido</p>
          <ol className="space-y-0.5 text-sm">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 rounded-xl px-2 py-1.5 text-black/60 transition-colors hover:bg-canvas hover:text-black"
                >
                  <span className="tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="rounded-[28px] bg-white px-6 py-8 shadow-card sm:px-12 sm:py-12">
          <p role="note" className="mb-10 rounded-[20px] bg-canvas px-5 py-4 text-sm font-semibold text-ink">
            Borrador · Pendiente de revisión legal.
          </p>
          <div className="space-y-12">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <p className="text-xs font-semibold tabular-nums tracking-[0.14em] text-muted">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{section.title}</h2>
                <div className="mt-4 max-w-[68ch] space-y-4 text-[17px] leading-[1.75] text-black/65">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
