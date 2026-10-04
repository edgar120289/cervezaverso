import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { LandingModule, LandingModuleId } from "@/lib/landing";

const FALLBACK_TITLE: Record<LandingModuleId, string> = {
  split: "Bloque dividido",
  impact: "Banner de impacto",
  grid: "Cuadrícula",
};

const PLACEHOLDER = "Espacio reservado: aquí irá el contenido de este bloque.";

function SplitModule({ title }: { title: string }) {
  return (
    <section aria-labelledby="module-split" className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col justify-center rounded-[28px] bg-white p-8 shadow-card sm:p-10">
        <h2 id="module-split" className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-muted">{PLACEHOLDER}</p>
      </div>
      <div
        aria-hidden
        className="flex min-h-56 items-center justify-center rounded-[28px] bg-white text-black/20 shadow-card"
      >
        <Sparkles size={40} />
      </div>
    </section>
  );
}

function ImpactModule({ title }: { title: string }) {
  return (
    <section
      aria-labelledby="module-impact"
      className="rounded-[28px] bg-accent px-6 py-14 text-center text-white shadow-accent sm:px-12 sm:py-20"
    >
      <h2
        id="module-impact"
        className="mx-auto max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl"
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/90">{PLACEHOLDER}</p>
    </section>
  );
}

function GridModule({ title }: { title: string }) {
  return (
    <section aria-labelledby="module-grid">
      <h2 id="module-grid" className="mb-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        <div className="flex min-h-48 items-end rounded-[28px] bg-white p-6 shadow-card md:col-span-2 md:row-span-2">
          <p className="text-sm text-muted">{PLACEHOLDER}</p>
        </div>
        <div className="flex min-h-32 items-end rounded-[28px] bg-white p-6 shadow-card">
          <p className="text-sm text-muted">{PLACEHOLDER}</p>
        </div>
        <div className="flex min-h-32 items-end rounded-[28px] bg-white p-6 shadow-card">
          <p className="text-sm text-muted">{PLACEHOLDER}</p>
        </div>
      </div>
    </section>
  );
}

const RENDERERS: Record<LandingModuleId, (props: { title: string }) => ReactNode> = {
  split: SplitModule,
  impact: ImpactModule,
  grid: GridModule,
};

/** Un bloque tal como se ve en la tienda; el editor de /admin/landing lo reutiliza para su vista previa. */
export function LandingModuleView({ module }: { module: LandingModule }) {
  const Module = RENDERERS[module.id];
  return <Module title={module.title.trim() || FALLBACK_TITLE[module.id]} />;
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
