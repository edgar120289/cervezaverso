"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { elegirTribu } from "@/app/actions/cuenta";
import { TRIBUS, type TribuId } from "@/lib/tribus";

export default function TribeSelector({ current }: { current: TribuId | null }) {
  const [selected, setSelected] = useState<TribuId | null>(current);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(id: TribuId) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id);
    setFailed(false);
    startTransition(async () => {
      const { ok } = await elegirTribu(id);
      if (!ok) {
        setSelected(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="¿De qué Team eres?" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TRIBUS.map((tribu) => {
          const active = tribu.id === selected;
          return (
            <button
              key={tribu.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => choose(tribu.id)}
              className={`flex min-h-11 items-start justify-between gap-3 rounded-[28px] border bg-white p-5 text-left shadow-card transition-transform active:scale-[0.99] ${
                active ? "border-accent" : "border-transparent hover:border-black/10"
              }`}
            >
              <span>
                <span className="block font-semibold">{tribu.label}</span>
                <span className="mt-1 block text-sm text-muted">{tribu.note}</span>
              </span>
              {active && <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />}
            </button>
          );
        })}
      </div>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          No pudimos guardar tu team. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
