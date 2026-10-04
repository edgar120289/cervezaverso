"use client";

import { LANDING_MODULES, MODULE_TITLE_MAX, type LandingModule } from "@/lib/landing";
import { LandingModuleView } from "@/components/landing/LandingModules";
import Switch from "./Switch";

type LandingModulesEditorProps = {
  modules: LandingModule[];
  onChange: (modules: LandingModule[]) => void;
};

const ORDERS = [1, 2, 3] as const;

/**
 * Tres bloques modulares de la landing. Cada uno tiene interruptor, título y orden (1, 2 o 3);
 * al elegir un orden ya ocupado, los dos bloques intercambian su lugar para que nunca se repita.
 */
export default function LandingModulesEditor({ modules, onChange }: LandingModulesEditorProps) {
  function patch(id: LandingModule["id"], changes: Partial<LandingModule>) {
    onChange(modules.map((module) => (module.id === id ? { ...module, ...changes } : module)));
  }

  function changeOrder(id: LandingModule["id"], order: LandingModule["order"]) {
    const moving = modules.find((module) => module.id === id);
    if (!moving) return;
    onChange(
      modules.map((module) => {
        if (module.id === id) return { ...module, order };
        if (module.order === order) return { ...module, order: moving.order };
        return module;
      }),
    );
  }

  const sorted = [...modules].sort((a, b) => a.order - b.order);

  return (
    <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-card" aria-labelledby="landing-modules">
      <div>
        <h2 id="landing-modules" className="font-semibold tracking-tight">
          Bloques de la landing
        </h2>
        <p className="text-xs text-muted">Se apilan debajo del Hero según su orden. Un bloque apagado no se muestra. Cada vista previa es el bloque real, con tu título actual.</p>
      </div>
      <ul className="space-y-3">
        {sorted.map((module) => {
          const info = LANDING_MODULES.find((item) => item.id === module.id)!;
          return (
            <li key={module.id} className="space-y-3 rounded-[20px] bg-canvas p-4">
              <Switch
                checked={module.enabled}
                onChange={(enabled) => patch(module.id, { enabled })}
                label={info.label}
                description={info.description}
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                  Título · {module.title.length}/{MODULE_TITLE_MAX}
                  <input
                    type="text"
                    value={module.title}
                    maxLength={MODULE_TITLE_MAX}
                    onChange={(e) => patch(module.id, { title: e.target.value })}
                    className="mt-1 min-h-11 w-full rounded-full bg-white px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                  Orden
                  <select
                    value={module.order}
                    onChange={(e) => changeOrder(module.id, Number(e.target.value) as LandingModule["order"])}
                    className="mt-1 min-h-11 w-full cursor-pointer rounded-full bg-white px-4 text-sm font-semibold normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15 sm:w-28"
                  >
                    {ORDERS.map((order) => (
                      <option key={order} value={order}>
                        {order}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Vista previa{!module.enabled && " · apagado, no se muestra en la tienda"}
                </p>
                <div
                  className={`overflow-hidden rounded-[28px] bg-canvas p-3 ring-1 ring-black/10 ${module.enabled ? "" : "opacity-50"}`}
                >
                  <LandingModuleView module={module} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
