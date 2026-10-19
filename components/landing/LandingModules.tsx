import Image from "next/image";
import { Sparkles } from "lucide-react";
import CtaLink from "@/components/CtaLink";
import type { GridModule, ImpactModule, LandingModule, SplitModule } from "@/lib/landing";
import { spotlightRef, type BlockStyle } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import { ALIGN_COLUMN, ALIGN_ROW, SECTION_TITLE_CLASS, SUBTITLE_CLASS, ctaLook } from "./banner-style";
import { GRID_ICONS } from "./icons";
import StyledBanner from "./StyledBanner";

const EMPTY_HINT = "Aún sin contenido: llena los campos de este bloque y aparecerá aquí.";

const TEXT_ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

function Heading({ id, title, className, style }: { id: string; title: string; className: string; style: BlockStyle }) {
  return title ? (
    <h2 id={id} style={style.title_color ? { color: style.title_color } : undefined} className={className}>
      {title}
    </h2>
  ) : null;
}

function SplitView({ module, preview }: { module: SplitModule; preview: boolean }) {
  const { style } = module;
  const hasText = Boolean(module.title || module.body || module.ctas.length);
  if (!hasText && !module.image_url) return preview ? <EmptyView /> : null;

  const imageFirst = module.image_position === "left";

  return (
    <section
      id="modulo-dividido"
      aria-labelledby={module.title ? "module-split" : undefined}
      className={`scroll-mt-24 grid gap-4 ${module.image_url && hasText ? "@min-[736px]:grid-cols-2" : ""}`}
    >
      {hasText && (
        <div
          className={`flex flex-col justify-center rounded-[28px] bg-white p-8 shadow-card @min-[608px]:p-10 ${ALIGN_COLUMN[style.align]} ${
            imageFirst ? "@min-[736px]:order-2" : ""
          }`}
        >
          <Heading
            id="module-split"
            title={module.title}
            style={style}
            className={`break-words font-semibold tracking-[-0.04em] ${SECTION_TITLE_CLASS[style.title_size]}`}
          />
          {module.body && (
            <p
              style={style.subtitle_color ? { color: style.subtitle_color } : undefined}
              className={`mt-3 whitespace-pre-line text-pretty text-muted ${SUBTITLE_CLASS[style.subtitle_size]}`}
            >
              {module.body}
            </p>
          )}
          {module.ctas.length > 0 && (
            <div className={`mt-6 flex w-full flex-wrap gap-3 ${ALIGN_ROW[style.align]}`}>
              {module.ctas.map((cta, index) => {
                const look = ctaLook(style, index, false);
                return (
                  <CtaLink key={`${cta.text}-${index}`} cta={cta} className={look.className} style={look.style}>
                    {look.arrow ? `${cta.text} →` : undefined}
                  </CtaLink>
                );
              })}
            </div>
          )}
        </div>
      )}
      {module.image_url && (
        <div
          className={`relative min-h-64 overflow-hidden rounded-[28px] bg-white shadow-card @min-[736px]:min-h-80 ${
            hasText ? (imageFirst ? "@min-[736px]:order-1" : "") : "aspect-[2/1]"
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

function ImpactView({ module, preview, product }: { module: ImpactModule; preview: boolean; product: Product | null }) {
  const hasContent = Boolean(
    module.title || module.subtitle || module.ctas.length || (module.style.spotlight.enabled && product),
  );
  if (!hasContent) return preview ? <EmptyView /> : null;

  return (
    <StyledBanner
      id="modulo-banner"
      ariaLabel={module.title || "Promoción"}
      headingTag={preview ? "div" : "h2"}
      title={module.title}
      subtitle={module.subtitle}
      ctas={module.ctas}
      style={module.style}
      imageUrl={module.image_url}
      imageAlt={module.image_alt}
      product={product}
      accentBackdrop
      tall={module.style.spotlight.enabled && Boolean(product)}
    />
  );
}

function GridView({ module, preview }: { module: GridModule; preview: boolean }) {
  const { style } = module;
  if (!module.title && module.items.length === 0) return preview ? <EmptyView /> : null;

  return (
    <section id="modulo-cuadricula" aria-labelledby={module.title ? "module-grid" : undefined} className="scroll-mt-24">
      <Heading
        id="module-grid"
        title={module.title}
        style={style}
        className={`mb-4 break-words font-semibold tracking-[-0.04em] ${SECTION_TITLE_CLASS[style.title_size]} ${TEXT_ALIGN[style.align]}`}
      />
      {module.items.length > 0 && (
        <ul className="grid gap-4 @min-[608px]:grid-cols-2 @min-[992px]:grid-cols-3">
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

function ModuleBody({
  module,
  preview = false,
  products = {},
}: {
  module: LandingModule;
  preview?: boolean;
  products?: Record<string, Product>;
}) {
  switch (module.id) {
    case "split":
      return <SplitView module={module} preview={preview} />;
    case "impact": {
      const ref = spotlightRef(module.style);
      return <ImpactView module={module} preview={preview} product={ref ? (products[ref] ?? null) : null} />;
    }
    case "grid":
      return <GridView module={module} preview={preview} />;
  }
}

/**
 * Un bloque tal como se ve en la tienda. El editor de /admin/landing lo reutiliza con `preview`
 * para mostrar un aviso cuando el bloque aún no tiene contenido (en la tienda no se pinta nada).
 */
export function LandingModuleView({
  module,
  preview = false,
  products = {},
}: {
  module: LandingModule;
  preview?: boolean;
  products?: Record<string, Product>;
}) {
  return (
    <div className="@container">
      <ModuleBody module={module} preview={preview} products={products} />
    </div>
  );
}

/** Bloques de `landing_settings.modules`: solo los activos y en el orden configurado (1, 2, 3). */
export default function LandingModules({
  modules,
  products,
}: {
  modules: LandingModule[];
  products: Record<string, Product>;
}) {
  const visible = modules.filter((module) => module.enabled).sort((a, b) => a.order - b.order);

  return (
    <>
      {visible.map((module) => (
        <LandingModuleView key={module.id} module={module} products={products} />
      ))}
    </>
  );
}
