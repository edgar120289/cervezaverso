import Image from "next/image";
import { Sparkles } from "lucide-react";
import CtaLink from "@/components/CtaLink";
import { CTA_BASE, CTA_PRIMARY, CTA_SECONDARY } from "@/components/HeroCtas";
import type { GridModule, ImpactModule, LandingModule, SplitModule } from "@/lib/landing";
import { GRID_ICONS } from "./icons";

const EMPTY_HINT = "Aún sin contenido: llena los campos de este bloque y aparecerá aquí.";

/** Botón principal sobre el fondo de acento del banner: blanco para que no se pierda. */
const CTA_ON_ACCENT = `${CTA_BASE} bg-white text-black hover:bg-white/90`;

const OUTLINE_DARK =
  "inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black/80 px-7 text-sm font-semibold transition-colors hover:bg-black hover:text-white active:scale-[0.98]";

function Heading({ id, title, className }: { id: string; title: string; className: string }) {
  return title ? (
    <h2 id={id} className={className}>
      {title}
    </h2>
  ) : null;
}

function SplitView({ module, preview }: { module: SplitModule; preview: boolean }) {
  const hasText = Boolean(module.title || module.body || module.ctas.length);
  if (!hasText && !module.image_url) return preview ? <EmptyView /> : null;

  const imageFirst = module.image_position === "left";

  return (
    <section
      id="modulo-dividido"
      aria-labelledby={module.title ? "module-split" : undefined}
      className={`scroll-mt-24 grid gap-4 ${module.image_url && hasText ? "md:grid-cols-2" : ""}`}
    >
      {hasText && (
        <div
          className={`flex flex-col justify-center rounded-[28px] bg-white p-8 shadow-card sm:p-10 ${
            imageFirst ? "md:order-2" : ""
          }`}
        >
          <Heading id="module-split" title={module.title} className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" />
          {module.body && <p className="mt-3 whitespace-pre-line text-pretty text-muted">{module.body}</p>}
          {module.ctas.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {module.ctas.map((cta, index) => (
                <CtaLink key={`${cta.text}-${index}`} cta={cta} className={index === 0 ? CTA_PRIMARY : OUTLINE_DARK} />
              ))}
            </div>
          )}
        </div>
      )}
      {module.image_url && (
        <div
          className={`relative min-h-64 overflow-hidden rounded-[28px] bg-white shadow-card md:min-h-80 ${
            hasText ? (imageFirst ? "md:order-1" : "") : "aspect-[2/1]"
          }`}
        >
          <Image
            src={module.image_url}
            alt={module.image_alt}
            fill
            sizes="(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
    </section>
  );
}

function ImpactView({ module, preview }: { module: ImpactModule; preview: boolean }) {
  const hasContent = Boolean(module.title || module.subtitle || module.ctas.length);
  if (!hasContent) return preview ? <EmptyView /> : null;

  return (
    <section
      id="modulo-banner"
      aria-labelledby={module.title ? "module-impact" : undefined}
      className="scroll-mt-24 relative isolate overflow-hidden rounded-[28px] bg-accent px-6 py-14 text-center text-white shadow-accent sm:px-12 sm:py-20"
    >
      {module.image_url && (
        <>
          <Image
            src={module.image_url}
            alt={module.image_alt}
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="-z-10 object-cover"
          />
          {module.darken && <div aria-hidden className="absolute inset-0 -z-10 bg-black/55" />}
        </>
      )}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 [text-shadow:0_2px_16px_rgb(0_0_0/0.45)]">
        <Heading
          id="module-impact"
          title={module.title}
          className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl"
        />
        {module.subtitle && <p className="max-w-xl text-pretty text-white/90 sm:text-lg">{module.subtitle}</p>}
      </div>
      {module.ctas.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {module.ctas.map((cta, index) => (
            <CtaLink
              key={`${cta.text}-${index}`}
              cta={cta}
              className={index === 0 ? CTA_ON_ACCENT : CTA_SECONDARY}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GridView({ module, preview }: { module: GridModule; preview: boolean }) {
  if (!module.title && module.items.length === 0) return preview ? <EmptyView /> : null;

  return (
    <section id="modulo-cuadricula" aria-labelledby={module.title ? "module-grid" : undefined} className="scroll-mt-24">
      <Heading id="module-grid" title={module.title} className="mb-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" />
      {module.items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {module.items.map((item, index) => {
            const Icon = GRID_ICONS[item.icon];
            return (
              <li key={`${item.title}-${index}`} className="flex flex-col gap-3 rounded-[28px] bg-white p-6 shadow-card">
                <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-canvas text-accent">
                  {item.icon_image_url ? (
                    <Image src={item.icon_image_url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <Icon size={22} aria-hidden />
                  )}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                {item.text && <p className="text-sm text-muted">{item.text}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EmptyView() {
  return (
    <div className="flex items-center gap-3 rounded-[28px] bg-white p-6 text-sm text-muted shadow-card">
      <Sparkles size={20} aria-hidden className="shrink-0" />
      {EMPTY_HINT}
    </div>
  );
}

/**
 * Un bloque tal como se ve en la tienda. El editor de /admin/landing lo reutiliza con `preview`
 * para mostrar un aviso cuando el bloque aún no tiene contenido (en la tienda no se pinta nada).
 */
export function LandingModuleView({ module, preview = false }: { module: LandingModule; preview?: boolean }) {
  switch (module.id) {
    case "split":
      return <SplitView module={module} preview={preview} />;
    case "impact":
      return <ImpactView module={module} preview={preview} />;
    case "grid":
      return <GridView module={module} preview={preview} />;
  }
}

/** Bloques de `landing_settings.modules`: solo los activos y en el orden configurado (1, 2, 3). */
export default function LandingModules({ modules }: { modules: LandingModule[] }) {
  const visible = modules.filter((module) => module.enabled).sort((a, b) => a.order - b.order);

  return (
    <>
      {visible.map((module) => (
        <LandingModuleView key={module.id} module={module} />
      ))}
    </>
  );
}
