"use client";

import { Plus, X } from "lucide-react";
import {
  GRID_ICON_NAMES,
  GRID_ITEM_TEXT_MAX,
  GRID_ITEM_TITLE_MAX,
  LANDING_MODULES,
  MAX_GRID_ITEMS,
  MAX_IMPACT_CTAS,
  MAX_SPLIT_CTAS,
  MODULE_BODY_MAX,
  MODULE_SUBTITLE_MAX,
  MODULE_TITLE_MAX,
  type GridItem,
  type GridModule,
  type ImpactModule,
  type LandingModule,
  type SplitModule,
} from "@/lib/landing";
import type { Product } from "@/lib/types";
import BlockEditor, { type StyleFeatures } from "./BlockEditor";
import HeroCtaEditor from "./HeroCtaEditor";
import ImageUploadField from "./ImageUploadField";
import Switch from "./Switch";

const STYLE_FEATURES: Record<LandingModule["id"], StyleFeatures> = {
  split: { subtitle: true },
  impact: { subtitle: true, layout: true, overlay: true, spotlight: true },
  grid: { subtitle: false, buttons: false },
};

const ORDERS = [1, 2, 3] as const;

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted";
const inputClass =
  "mt-1 min-h-11 w-full rounded-full bg-white px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15";
const textareaClass =
  "mt-1 w-full resize-none rounded-[20px] bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15";

function segmentClass(active: boolean) {
  return `min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-white text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

/**
 * Controles de un bloque modular: interruptor, orden (1, 2 o 3; al elegir uno ocupado los dos bloques
 * intercambian lugar) y las secciones del Studio. La vista previa vive en el lienzo.
 */
export function ModuleEditor({
  module,
  onPatch,
  onOrderChange,
  products,
  productsLoading,
}: {
  module: LandingModule;
  onPatch: (changes: Partial<LandingModule>) => void;
  onOrderChange: (order: LandingModule["order"]) => void;
  products: Record<string, Product>;
  productsLoading: boolean;
}) {
  const info = LANDING_MODULES.find((item) => item.id === module.id)!;

  return (
    <div>
      <div className="space-y-3 px-4 pb-4">
        <Switch
          checked={module.enabled}
          onChange={(enabled) => onPatch({ enabled })}
          label={info.label}
          description={info.description}
        />
        <label className={`${labelClass} sm:w-28`}>
          Orden
          <select
            value={module.order}
            onChange={(e) => onOrderChange(Number(e.target.value) as LandingModule["order"])}
            className={`${inputClass} cursor-pointer font-semibold`}
          >
            {ORDERS.map((order) => (
              <option key={order} value={order}>
                {order}
              </option>
            ))}
          </select>
        </label>
      </div>
      <BlockEditor
        value={module.style}
        onChange={(style) => onPatch({ style })}
        features={STYLE_FEATURES[module.id]}
        products={products}
        productsLoading={productsLoading}
        subtitleLabel={module.id === "split" ? "Párrafo" : "Subtítulo"}
        imageSlot={
          module.id === "split" ? (
            <SplitFields part="image" module={module} onChange={onPatch} />
          ) : module.id === "impact" ? (
            <ImpactFields part="image" module={module} onChange={onPatch} />
          ) : undefined
        }
        textSlot={
          module.id === "split" ? (
            <SplitFields part="text" module={module} onChange={onPatch} />
          ) : module.id === "impact" ? (
            <ImpactFields part="text" module={module} onChange={onPatch} />
          ) : (
            <GridFields module={module} onChange={onPatch} />
          )
        }
        ctaSlot={
          module.id === "split" ? (
            <SplitFields part="cta" module={module} onChange={onPatch} />
          ) : module.id === "impact" ? (
            <ImpactFields part="cta" module={module} onChange={onPatch} />
          ) : undefined
        }
      />
    </div>
  );
}

function TitleField({ module, onChange }: { module: LandingModule; onChange: (changes: Partial<LandingModule>) => void }) {
  return (
    <label className={labelClass}>
      Título (opcional) · {module.title.length}/{MODULE_TITLE_MAX}
      <input
        spellCheck
        lang="es"
        type="text"
        value={module.title}
        maxLength={MODULE_TITLE_MAX}
        onChange={(e) => onChange({ title: e.target.value })}
        className={inputClass}
      />
    </label>
  );
}

type Part = "image" | "text" | "cta";

function SplitFields({
  part,
  module,
  onChange,
}: {
  part: Part;
  module: SplitModule;
  onChange: (changes: Partial<SplitModule>) => void;
}) {
  if (part === "cta") {
    return <HeroCtaEditor label="Layout dividido" ctas={module.ctas} max={MAX_SPLIT_CTAS} onChange={(ctas) => onChange({ ctas })} />;
  }

  if (part === "text") {
    return (
      <div className="space-y-3">
        <TitleField module={module} onChange={(changes) => onChange(changes as Partial<SplitModule>)} />
        <label className={labelClass}>
          Párrafo · {module.body.length}/{MODULE_BODY_MAX}
          <textarea
            spellCheck
            lang="es"
            value={module.body}
            maxLength={MODULE_BODY_MAX}
            rows={6}
            onChange={(e) => onChange({ body: e.target.value })}
            className={textareaClass}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ImageUploadField
        label="Imagen"
        recommended="800x800px"
        value={module.image_url}
        onChange={(image_url) => onChange({ image_url })}
      />
      {module.image_url && (
        <label className={labelClass}>
          Descripción de la imagen (Opcional - Mejora el SEO)
          <input
            spellCheck
            lang="es"
            type="text"
            value={module.image_alt}
            maxLength={200}
            onChange={(e) => onChange({ image_alt: e.target.value })}
            className={inputClass}
          />
        </label>
      )}
      <fieldset>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Posición de la imagen</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={module.image_position === "left"}
            onClick={() => onChange({ image_position: "left" })}
            className={segmentClass(module.image_position === "left")}
          >
            Imagen a la izquierda
          </button>
          <button
            type="button"
            aria-pressed={module.image_position === "right"}
            onClick={() => onChange({ image_position: "right" })}
            className={segmentClass(module.image_position === "right")}
          >
            Imagen a la derecha
          </button>
        </div>
      </fieldset>
    </div>
  );
}

function ImpactFields({
  part,
  module,
  onChange,
}: {
  part: Part;
  module: ImpactModule;
  onChange: (changes: Partial<ImpactModule>) => void;
}) {
  if (part === "cta") {
    return <HeroCtaEditor label="Banner de impacto" ctas={module.ctas} max={MAX_IMPACT_CTAS} onChange={(ctas) => onChange({ ctas })} />;
  }

  if (part === "image") {
    return (
      <div className="space-y-3">
        <ImageUploadField
          label="Imagen de fondo"
          recommended="1920x600px"
          value={module.image_url}
          onChange={(image_url) => onChange({ image_url })}
        />
        {module.image_url && (
          <label className={labelClass}>
            Descripción de la imagen (Opcional - Mejora el SEO)
            <input
              spellCheck
              lang="es"
              type="text"
              value={module.image_alt}
              maxLength={200}
              onChange={(e) => onChange({ image_alt: e.target.value })}
              className={inputClass}
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TitleField module={module} onChange={(changes) => onChange(changes as Partial<ImpactModule>)} />
      <label className={labelClass}>
        Subtítulo · {module.subtitle.length}/{MODULE_SUBTITLE_MAX}
        <textarea
          spellCheck
          lang="es"
          value={module.subtitle}
          maxLength={MODULE_SUBTITLE_MAX}
          rows={3}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className={textareaClass}
        />
      </label>
    </div>
  );
}

function GridFields({ module, onChange }: { module: GridModule; onChange: (changes: Partial<GridModule>) => void }) {
  function updateItem(index: number, changes: Partial<GridItem>) {
    onChange({ items: module.items.map((item, i) => (i === index ? { ...item, ...changes } : item)) });
  }

  return (
    <div className="space-y-3">
      <TitleField module={module} onChange={(changes) => onChange(changes as Partial<GridModule>)} />
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Elementos ({module.items.length}/{MAX_GRID_ITEMS})
      </legend>
      {module.items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-[20px] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Elemento {index + 1}</p>
            <button
              type="button"
              onClick={() => onChange({ items: module.items.filter((_, i) => i !== index) })}
              aria-label={`Quitar el elemento ${index + 1}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 hover:bg-danger hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <label className={labelClass}>
              Ícono
              <select
                value={item.icon}
                onChange={(e) => updateItem(index, { icon: e.target.value as GridItem["icon"] })}
                disabled={Boolean(item.icon_image_url)}
                className={`${inputClass} bg-canvas disabled:opacity-50`}
              >
                {GRID_ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <ImageUploadField
              compact
              label="O sube un ícono propio"
              recommended="128x128px"
              value={item.icon_image_url}
              onChange={(icon_image_url) => updateItem(index, { icon_image_url })}
            />
          </div>
          <label className={labelClass}>
            Título corto · {item.title.length}/{GRID_ITEM_TITLE_MAX}
            <input
              spellCheck
              lang="es"
              type="text"
              value={item.title}
              maxLength={GRID_ITEM_TITLE_MAX}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              className={`${inputClass} bg-canvas`}
            />
          </label>
          <label className={labelClass}>
            Texto corto · {item.text.length}/{GRID_ITEM_TEXT_MAX}
            <textarea
              spellCheck
              lang="es"
              value={item.text}
              maxLength={GRID_ITEM_TEXT_MAX}
              rows={2}
              onChange={(e) => updateItem(index, { text: e.target.value })}
              className={`${textareaClass} bg-canvas`}
            />
          </label>
        </div>
      ))}
      {module.items.length < MAX_GRID_ITEMS && (
        <button
          type="button"
          onClick={() => onChange({ items: [...module.items, { icon: "Beer", icon_image_url: null, title: "", text: "" }] })}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold transition-colors hover:bg-black hover:text-white"
        >
          <Plus size={14} aria-hidden />
          Agregar elemento
        </button>
      )}
    </fieldset>
    </div>
  );
}
