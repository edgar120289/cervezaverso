"use client";

import { Plus, X } from "lucide-react";
import { MAX_HERO_CTAS, type HeroCta } from "@/lib/hero";
import LinkBuilder from "./LinkBuilder";

type HeroCtaEditorProps = {
  /** Nombre accesible del grupo (por ejemplo, "Banner 2"). */
  label: string;
  ctas: HeroCta[];
  onChange: (ctas: HeroCta[]) => void;
  /** Máximo de botones (3 en el Hero). */
  max?: number;
};

const fieldClass =
  "min-h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

/** Editor de botones: texto y destino con el Constructor de Enlaces. El 1.º es sólido; los demás, de contorno. */
export default function HeroCtaEditor({ label, ctas, onChange, max = MAX_HERO_CTAS }: HeroCtaEditorProps) {
  function update(index: number, patch: Partial<HeroCta>) {
    onChange(ctas.map((cta, i) => (i === index ? { ...cta, ...patch } : cta)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Botones ({ctas.length}/{max})
      </legend>
      {ctas.map((cta, index) => (
        <div key={index} className="grid gap-2 rounded-[20px] border border-black/5 p-3 lg:grid-cols-[14rem_1fr_auto]">
          <input
            type="text"
            value={cta.text}
            maxLength={40}
            onChange={(e) => update(index, { text: e.target.value })}
            placeholder={index === 0 ? "Texto (botón principal)" : "Texto (botón secundario)"}
            aria-label={`${label}: texto del botón ${index + 1}`}
            className={fieldClass}
          />
          <LinkBuilder label={`${label}: botón ${index + 1}`} value={cta} onChange={(link) => update(index, link)} />
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
      {ctas.length < max && (
        <button
          type="button"
          onClick={() => onChange([...ctas, { text: "", url: "/tienda", is_external: false }])}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 text-xs font-semibold transition-colors hover:bg-black hover:text-white"
        >
          <Plus size={14} aria-hidden />
          Agregar botón
        </button>
      )}
    </fieldset>
  );
}
