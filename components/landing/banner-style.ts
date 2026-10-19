import type { CSSProperties } from "react";
import {
  readableTextOn,
  type Align,
  type BlockStyle,
  type SubtitleSize,
  type TitleSize,
} from "@/lib/landing-style";

/** Escala de títulos para banners a todo el ancho (Hero y banner de impacto). */
export const BANNER_TITLE_CLASS: Record<TitleSize, string> = {
  s: "text-2xl @min-[608px]:text-3xl @min-[992px]:text-4xl",
  m: "text-3xl @min-[608px]:text-4xl @min-[992px]:text-5xl",
  l: "text-4xl @min-[608px]:text-5xl @min-[992px]:text-6xl",
  xl: "text-4xl @min-[608px]:text-6xl @min-[992px]:text-7xl",
  xxl: "text-5xl @min-[608px]:text-7xl @min-[992px]:text-8xl",
};

/** Escala de títulos de sección (layout dividido y cuadrícula). */
export const SECTION_TITLE_CLASS: Record<TitleSize, string> = {
  s: "text-xl @min-[608px]:text-2xl",
  m: "text-2xl @min-[608px]:text-3xl",
  l: "text-3xl @min-[608px]:text-4xl",
  xl: "text-4xl @min-[608px]:text-5xl",
  xxl: "text-5xl @min-[608px]:text-6xl",
};

export const SUBTITLE_CLASS: Record<SubtitleSize, string> = {
  s: "text-sm @min-[608px]:text-base",
  m: "text-base @min-[608px]:text-lg",
  l: "text-lg @min-[608px]:text-xl @min-[992px]:text-2xl",
};

export const ALIGN_COLUMN: Record<Align, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export const ALIGN_ROW: Record<Align, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

/** Caja de texto: pegada al lado elegido dentro de su contenedor. */
export const ALIGN_SELF: Record<Align, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

export const TEXT_SHADOW = "[text-shadow:0_2px_16px_rgb(0_0_0/0.6),0_1px_3px_rgb(0_0_0/0.5)]";

const ACCENT = "#5433eb";
const CTA_BASE = "inline-flex min-h-12 items-center justify-center text-sm font-semibold transition active:scale-[0.98]";

type CtaLook = { className: string; style: CSSProperties; arrow: boolean };

/**
 * Apariencia de un botón según la variante del bloque. Con una variante rellena, solo el primero va
 * relleno y los demás quedan de contorno (un solo CTA principal por bloque). `onDark`: el fondo es oscuro,
 * así que los colores automáticos son claros; `autoFill`: relleno automático del botón principal.
 */
export function ctaLook(style: BlockStyle, index: number, onDark: boolean, autoFill: string = ACCENT): CtaLook {
  const { button_variant: variant, button_bg: bg, button_text: text } = style;
  const autoLine = onDark ? "#ffffff" : "#000000";

  if (variant === "link") {
    return {
      className: `${CTA_BASE} px-1 underline-offset-4 hover:underline`,
      style: { color: text ?? bg ?? autoLine },
      arrow: true,
    };
  }

  const radius = variant === "solid" ? "rounded-md" : "rounded-full";
  const filled = (variant === "solid" || variant === "pill") && index === 0;
  if (filled) {
    const fill = bg ?? autoFill;
    return {
      className: `${CTA_BASE} ${radius} px-7 hover:brightness-110`,
      style: { backgroundColor: fill, color: text ?? readableTextOn(fill) },
      arrow: false,
    };
  }

  const line = bg ?? autoLine;
  return {
    className: `${CTA_BASE} ${radius} border-2 px-7 hover:opacity-80`,
    style: { borderColor: line, color: text ?? line },
    arrow: false,
  };
}
