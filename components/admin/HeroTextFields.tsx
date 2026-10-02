"use client";

import { useId } from "react";

export const HERO_TITLE_MAX = 120;
export const HERO_SUBTITLE_MAX = 240;

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted";
const fieldClass =
  "mt-1 w-full bg-canvas px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15";

type HeroTextFieldsProps = {
  title: string;
  subtitle: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
};

/** Título y subtítulo opcionales del Hero (video o banner). Vacíos, la tienda usa el lema de la marca. */
export default function HeroTextFields({ title, subtitle, onTitleChange, onSubtitleChange }: HeroTextFieldsProps) {
  const hintId = useId();

  return (
    <div className="space-y-3">
      <label className={labelClass}>
        Título · {title.length}/{HERO_TITLE_MAX}
        <input
          type="text"
          value={title}
          maxLength={HERO_TITLE_MAX}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-describedby={hintId}
          placeholder="Vacío = «El placer del deber cumplido»"
          className={`${fieldClass} min-h-11 rounded-full`}
        />
      </label>
      <label className={labelClass}>
        Subtítulo · {subtitle.length}/{HERO_SUBTITLE_MAX}
        <textarea
          value={subtitle}
          maxLength={HERO_SUBTITLE_MAX}
          rows={3}
          onChange={(e) => onSubtitleChange(e.target.value)}
          aria-describedby={hintId}
          placeholder="Opcional"
          className={`${fieldClass} resize-none rounded-[20px] py-3`}
        />
      </label>
      <p id={hintId} className="text-[11px] text-muted">
        Se muestran sobre los botones, en blanco y con sombra para que se lean sobre cualquier fondo.
      </p>
    </div>
  );
}
