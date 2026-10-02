"use client";

import { Plus, X } from "lucide-react";
import { MAX_HERO_CTAS, type HeroCta } from "@/lib/hero";

type HeroCtaEditorProps = {
  /** Nombre accesible del grupo (por ejemplo, "Banner 2"). */
  label: string;
  ctas: HeroCta[];
  onChange: (ctas: HeroCta[]) => void;
};

const fieldClass =
  "min-h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

/** Editor de 0 a 3 botones (texto, destino y si el enlace es interno o externo). El 1.º es sólido; el 2.º y el 3.º, de contorno. */
export default function HeroCtaEditor({ label, ctas, onChange }: HeroCtaEditorProps) {
  function update(index: number, patch: Partial<HeroCta>) {
    onChange(ctas.map((cta, i) => (i === index ? { ...cta, ...patch } : cta)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Botones ({ctas.length}/{MAX_HERO_CTAS})
      </legend>
      {ctas.map((cta, index) => (
        <div key={index} className="grid gap-2 rounded-[20px] border border-black/5 p-3 sm:grid-cols-[1fr_1.4fr_9rem_auto]">
          <input
            type="text"
            value={cta.text}
            maxLength={40}
            onChange={(e) => update(index, { text: e.target.value })}
            placeholder={index === 0 ? "Texto (botón principal)" : "Texto (botón secundario)"}
            aria-label={`${label}: texto del botón ${index + 1}`}
            className={fieldClass}
          />
          <input
            type="text"
            inputMode="url"
            value={cta.url}
            maxLength={500}
            onChange={(e) => update(index, { url: e.target.value })}
            placeholder={cta.is_external ? "https://…" : "/#catalogo"}
            aria-label={`${label}: dirección del botón ${index + 1}`}
            className={fieldClass}
          />
          <select
            value={cta.is_external ? "external" : "internal"}
            onChange={(e) => update(index, { is_external: e.target.value === "external" })}
            aria-label={`${label}: tipo de enlace del botón ${index + 1}`}
            className={fieldClass}
          >
            <option value="internal">Interno</option>
            <option value="external">Externo</option>
          </select>
          <button
            type="button"
            onClick={() => onChange(ctas.filter((_, i) => i !== index))}
            aria-label={`${label}: quitar el botón ${index + 1}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 transition-colors hover:bg-danger hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      {ctas.length < MAX_HERO_CTAS && (
        <button
          type="button"
          onClick={() => onChange([...ctas, { text: "", url: "", is_external: false }])}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 text-xs font-semibold transition-colors hover:bg-black hover:text-white"
        >
          <Plus size={14} aria-hidden />
          Agregar botón
        </button>
      )}
    </fieldset>
  );
}
