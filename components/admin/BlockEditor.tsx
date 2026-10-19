"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { buscarProductosActivos, type ProductOption } from "@/app/actions/admin-landing";
import {
  ALIGNS,
  BUTTON_VARIANTS,
  LAYOUTS,
  OVERLAYS,
  SPOTLIGHT_BADGE_MAX,
  SPOTLIGHT_REF_MAX,
  SUBTITLE_SIZES,
  TITLE_SIZES,
  spotlightRef,
  type Align,
  type BlockStyle,
  type ButtonVariant,
  type Layout,
} from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import Switch from "./Switch";

export type StyleFeatures = {
  subtitle?: boolean;
  layout?: boolean;
  buttons?: boolean;
  overlay?: boolean;
  spotlight?: boolean;
};

type BlockEditorProps = {
  value: BlockStyle;
  onChange: (style: BlockStyle) => void;
  features: StyleFeatures;
  /** Productos ya resueltos por referencia, para confirmar la "Cerveza destacada". */
  products: Record<string, Product>;
  productsLoading: boolean;
  /** Texto del segundo campo de tipografía: "Subtítulo" o "Párrafo". */
  subtitleLabel?: string;
  /** 1 · Imagen o video de fondo (el control de la capa oscura se añade debajo). */
  imageSlot?: ReactNode;
  /** 2 · Título, subtítulo, texto del botón y URL de destino. */
  contentSlot: ReactNode;
  /** Vista previa en vivo: queda fija a la vista mientras se recorren los controles. */
  preview: ReactNode;
};

const PALETTE = [
  { hex: "#000000", name: "Negro" },
  { hex: "#ffffff", name: "Blanco" },
  { hex: "#5433eb", name: "Violeta de la marca" },
  { hex: "#f5a524", name: "Ámbar" },
  { hex: "#d92d20", name: "Rojo" },
  { hex: "#16a34a", name: "Verde" },
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted";
const inputClass =
  "mt-1 min-h-11 w-full rounded-full bg-canvas px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15";

const VARIANT_LABELS: Record<ButtonVariant, string> = {
  solid: "Sólido rectangular",
  pill: "Píldora",
  outline: "Outline",
  link: "Link de texto",
};
const LAYOUT_LABELS: Record<Layout, string> = {
  background: "Foto de fondo completo",
  split: "Dividido 50/50",
};
const ALIGN_LABELS: Record<Align, { label: string; Icon: typeof AlignLeft }> = {
  left: { label: "Izquierda", Icon: AlignLeft },
  center: { label: "Centro", Icon: AlignCenter },
  right: { label: "Derecha", Icon: AlignRight },
};

function segmentClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-white text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

function Segments({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Color opcional: paleta de la marca, selector del navegador o HEX escrito; "Automático" lo deja según el fondo. */
function ColorField({ legend, value, onChange }: { legend: string; value: string | null; onChange: (hex: string | null) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value ?? "";

  function handleText(text: string) {
    const next = text.startsWith("#") || text === "" ? text : `#${text}`;
    setDraft(next);
    if (HEX.test(next)) {
      onChange(next.toLowerCase());
      setDraft(null);
    }
  }

  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted">{legend}</legend>
      <div className="flex flex-wrap items-center gap-1">
        {PALETTE.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => onChange(color.hex)}
            aria-label={`${legend}: ${color.name}`}
            aria-pressed={value === color.hex}
            className="flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span
              style={{ backgroundColor: color.hex }}
              className={`h-7 w-7 rounded-full ring-1 ring-black/20 ${value === color.hex ? "outline outline-2 outline-offset-2 outline-black" : ""}`}
            />
          </button>
        ))}
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          aria-label={`${legend}: elegir otro color`}
          className="h-11 w-11 cursor-pointer rounded-full bg-transparent p-1"
        />
        <input
          type="text"
          value={shown}
          maxLength={7}
          placeholder="#HEX"
          onChange={(e) => handleText(e.target.value.trim())}
          onBlur={() => setDraft(null)}
          aria-label={`${legend}: código HEX`}
          className="min-h-11 w-24 rounded-full bg-white px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-black/15"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={segmentClass(value === null)}
        >
          Automático
        </button>
      </div>
    </fieldset>
  );
}

/** Referencia del producto (SKU o ID) con búsqueda por nombre; el resultado llena el campo. */
function SpotlightFields({
  value,
  onChange,
  products,
  loading,
}: {
  value: BlockStyle;
  onChange: (style: BlockStyle) => void;
  products: Record<string, Product>;
  loading: boolean;
}) {
  const refId = useId();
  const [results, setResults] = useState<ProductOption[]>([]);
  const timer = useRef<number | null>(null);
  const spotlight = value.spotlight;
  const ref = spotlightRef(value);
  const product = ref ? products[ref] : undefined;

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function patch(changes: Partial<BlockStyle["spotlight"]>) {
    onChange({ ...value, spotlight: { ...spotlight, ...changes } });
  }

  function handleRef(text: string) {
    patch({ sku: text });
    if (timer.current) window.clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = window.setTimeout(() => {
      buscarProductosActivos(text).then(setResults, () => setResults([]));
    }, 300);
  }

  return (
    <div className="space-y-3">
      <Switch
        checked={spotlight.enabled}
        onChange={(enabled) => patch({ enabled })}
        label="Destacar producto"
        description="Muestra una tarjeta con la foto, el nombre, la cervecería, el precio y el botón «Agregar al carrito»."
      />
      {spotlight.enabled && (
        <>
          <div>
            <label htmlFor={refId} className={labelClass}>
              SKU o ID del producto
            </label>
            <input
              id={refId}
              type="text"
              value={spotlight.sku}
              maxLength={SPOTLIGHT_REF_MAX}
              onChange={(e) => handleRef(e.target.value)}
              placeholder="Escribe un SKU, un ID o parte del nombre para buscar"
              className={inputClass}
            />
            {results.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-[20px] bg-white p-2">
                {results.map((option) => (
                  <li key={option.sku}>
                    <button
                      type="button"
                      onClick={() => {
                        patch({ sku: option.sku });
                        setResults([]);
                      }}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-full px-4 text-left text-sm hover:bg-canvas"
                    >
                      <span className="truncate font-semibold">{option.name}</span>
                      <span className="shrink-0 text-xs text-muted">{option.sku}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p aria-live="polite" className="mt-1 text-xs text-muted">
              {!ref && "Elige una cerveza activa."}
              {ref && loading && !product && "Buscando el producto…"}
              {ref && !loading && product && `Producto: ${product.name} · ${product.brewery}`}
              {ref && !loading && !product && "No hay un producto activo con esa referencia: el banner se mostrará sin la tarjeta."}
            </p>
          </div>
          <label className={labelClass}>
            Etiqueta (opcional) · {spotlight.badge.length}/{SPOTLIGHT_BADGE_MAX}
            <input
              type="text"
              value={spotlight.badge}
              maxLength={SPOTLIGHT_BADGE_MAX}
              onChange={(e) => patch({ badge: e.target.value })}
              placeholder="Edición limitada, Cerveza de la semana…"
              className={inputClass}
            />
          </label>
        </>
      )}
    </div>
  );
}

function Group({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-[20px] bg-canvas p-4" aria-label={title}>
      <h3 className="text-sm font-semibold tracking-tight">
        {step} · {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Editor de un bloque de la landing (Hero, banner o sección) en dos columnas: a la izquierda los controles
 * en orden (imagen y fondo, textos, tipografía y colores, forma y disposición, cerveza destacada) y a la
 * derecha la vista previa en vivo, fija mientras se recorren los controles. En móvil, la vista previa va primero.
 */
export default function BlockEditor({
  value,
  onChange,
  features,
  products,
  productsLoading,
  subtitleLabel = "Subtítulo",
  imageSlot,
  contentSlot,
  preview,
}: BlockEditorProps) {
  const overlayId = useId();

  function patch(changes: Partial<BlockStyle>) {
    onChange({ ...value, ...changes });
  }

  const showOverlay = features.overlay && value.layout === "background";
  let step = 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="order-2 space-y-4 lg:order-1">
        {(imageSlot || showOverlay) && (
          <Group step={++step} title="Imagen y fondo">
            {imageSlot}
            {showOverlay && (
              <div>
                <label htmlFor={overlayId} className={labelClass}>
                  Capa oscura sobre la imagen · {value.overlay} %
                </label>
                <input
                  id={overlayId}
                  type="range"
                  min={0}
                  max={100}
                  step={25}
                  value={value.overlay}
                  onChange={(e) => patch({ overlay: Number(e.target.value) as BlockStyle["overlay"] })}
                  className="mt-1 h-11 w-full cursor-pointer accent-accent"
                />
                <div aria-hidden className="flex justify-between text-[11px] text-muted">
                  {OVERLAYS.map((overlay) => (
                    <span key={overlay}>{overlay}%</span>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted">Con 0 % la imagen se ve limpia, sin filtro.</p>
              </div>
            )}
          </Group>
        )}

        <Group step={++step} title="Textos y contenido">
          {contentSlot}
        </Group>

        <Group step={++step} title="Tipografía y colores">
          <Segments legend="Tamaño del título">
            {TITLE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={value.title_size === size}
                onClick={() => patch({ title_size: size })}
                className={segmentClass(value.title_size === size)}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </Segments>
          <ColorField legend="Color del título" value={value.title_color} onChange={(title_color) => patch({ title_color })} />
          {features.subtitle !== false && (
            <>
              <Segments legend={`Tamaño del ${subtitleLabel.toLowerCase()}`}>
                {SUBTITLE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={value.subtitle_size === size}
                    onClick={() => patch({ subtitle_size: size })}
                    className={segmentClass(value.subtitle_size === size)}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </Segments>
              <ColorField
                legend={`Color del ${subtitleLabel.toLowerCase()}`}
                value={value.subtitle_color}
                onChange={(subtitle_color) => patch({ subtitle_color })}
              />
            </>
          )}
        </Group>

        <Group step={++step} title="Forma y disposición">
          <Segments legend="Alineación del texto y los botones">
            {ALIGNS.map((align) => {
              const { label, Icon } = ALIGN_LABELS[align];
              return (
                <button
                  key={align}
                  type="button"
                  aria-pressed={value.align === align}
                  onClick={() => patch({ align })}
                  className={segmentClass(value.align === align)}
                >
                  <Icon size={16} aria-hidden />
                  {label}
                </button>
              );
            })}
          </Segments>
          {features.layout && (
            <Segments legend="Disposición">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout}
                  type="button"
                  aria-pressed={value.layout === layout}
                  onClick={() => patch({ layout })}
                  className={segmentClass(value.layout === layout)}
                >
                  {LAYOUT_LABELS[layout]}
                </button>
              ))}
            </Segments>
          )}
          {features.buttons !== false && (
            <>
              <Segments legend="Estilo de los botones">
                {BUTTON_VARIANTS.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    aria-pressed={value.button_variant === variant}
                    onClick={() => patch({ button_variant: variant })}
                    className={segmentClass(value.button_variant === variant)}
                  >
                    {VARIANT_LABELS[variant]}
                  </button>
                ))}
              </Segments>
              <ColorField
                legend="Color de fondo del botón (o del contorno)"
                value={value.button_bg}
                onChange={(button_bg) => patch({ button_bg })}
              />
              <ColorField
                legend="Color del texto del botón"
                value={value.button_text}
                onChange={(button_text) => patch({ button_text })}
              />
            </>
          )}
        </Group>

        {features.spotlight && (
          <Group step={++step} title="Cerveza destacada">
            <SpotlightFields value={value} onChange={onChange} products={products} loading={productsLoading} />
          </Group>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <div className="space-y-2 lg:sticky lg:top-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Vista previa en vivo</p>
          <div className="overflow-hidden rounded-[28px] bg-canvas p-3 ring-1 ring-black/10">{preview}</div>
        </div>
      </div>
    </div>
  );
}
