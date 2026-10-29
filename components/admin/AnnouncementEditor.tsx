"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  ANNOUNCEMENT_MESSAGE_MAX,
  ANNOUNCEMENT_TOKENS,
  MAX_ANNOUNCEMENT_MESSAGES,
  type AnnouncementSettings,
  type AnnouncementValues,
} from "@/lib/announcement";
import Switch from "./Switch";

const inputClass =
  "min-h-11 w-full rounded-full bg-canvas px-4 text-sm text-black outline-none focus:ring-2 focus:ring-black/15";

function segmentClass(active: boolean) {
  return `min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-canvas text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

/** Editor de la barra negra de arriba: mensajes con claves que se llenan solas, dónde se muestra y a dónde lleva. */
export default function AnnouncementEditor({
  value,
  onChange,
  values,
}: {
  value: AnnouncementSettings;
  onChange: (patch: Partial<AnnouncementSettings>) => void;
  values: AnnouncementValues;
}) {
  const { messages } = value;

  function setMessage(index: number, text: string) {
    onChange({ messages: messages.map((m, i) => (i === index ? text : m)) });
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= messages.length) return;
    const next = [...messages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ messages: next });
  }

  return (
    <div className="space-y-5 px-4 pb-4">
      <Switch
        checked={value.enabled}
        onChange={(enabled) => onChange({ enabled })}
        label="Mostrar la barra"
        description="La barra negra arriba del header."
      />

      <fieldset>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Dónde se muestra</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={value.scope === "all"} onClick={() => onChange({ scope: "all" })} className={segmentClass(value.scope === "all")}>
            Todas las páginas
          </button>
          <button type="button" aria-pressed={value.scope === "home"} onClick={() => onChange({ scope: "home" })} className={segmentClass(value.scope === "home")}>
            Solo la portada
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">Siempre hasta arriba y no es fija: se va al bajar (el header sí queda fijo).</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Mensajes ({messages.length}/{MAX_ANNOUNCEMENT_MESSAGES})
        </legend>
        {messages.map((message, index) => (
          <div key={index} className="flex items-center gap-1">
            <input
              type="text"
              spellCheck
              lang="es"
              value={message}
              maxLength={ANNOUNCEMENT_MESSAGE_MAX}
              onChange={(e) => setMessage(index, e.target.value)}
              aria-label={`Mensaje ${index + 1}`}
              className={inputClass}
            />
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir" className="rounded-full p-2 hover:bg-canvas disabled:opacity-30">
              <ArrowUp size={15} />
            </button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === messages.length - 1} aria-label="Bajar" className="rounded-full p-2 hover:bg-canvas disabled:opacity-30">
              <ArrowDown size={15} />
            </button>
            <button
              type="button"
              onClick={() => onChange({ messages: messages.filter((_, i) => i !== index) })}
              aria-label={`Quitar mensaje ${index + 1}`}
              className="rounded-full p-2 text-danger hover:bg-canvas"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {messages.length < MAX_ANNOUNCEMENT_MESSAGES && (
          <button
            type="button"
            onClick={() => onChange({ messages: [...messages, ""] })}
            className="flex min-h-11 items-center gap-2 rounded-full bg-canvas px-4 text-sm font-semibold hover:bg-black/10"
          >
            <Plus size={15} /> Agregar mensaje
          </button>
        )}
        <div className="rounded-2xl bg-canvas p-3 text-[11px] text-muted">
          <p className="mb-1 font-semibold text-black/70">Datos que se llenan solos (escríbelos tal cual):</p>
          <ul className="space-y-0.5">
            {ANNOUNCEMENT_TOKENS.map(({ token, label }) => (
              <li key={token}>
                <code className="font-semibold text-black">{token}</code> → {values[token]} <span>({label})</span>
              </li>
            ))}
          </ul>
        </div>
      </fieldset>

      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
        A dónde lleva al tocarla
        <input
          type="text"
          value={value.href}
          maxLength={200}
          onChange={(e) => onChange({ href: e.target.value })}
          placeholder="/envios (vacío = sin enlace)"
          className={`${inputClass} mt-1 font-normal normal-case tracking-normal`}
        />
      </label>
    </div>
  );
}
