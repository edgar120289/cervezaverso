"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Gift, TicketPercent } from "lucide-react";
import { crearCupon } from "@/app/actions/admin-cupones";
import { formatMXN } from "@/lib/pricing";
import { firstIssue, promoCreateSchema } from "@/lib/validation";
import type { DiscountType } from "@/lib/types";

const inputClass =
  "w-full rounded-full bg-canvas px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15";

function toNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

const PRESETS: { label: string; type: DiscountType; value: string; maxUses: string; hint: string }[] = [
  { label: "Tarjeta de regalo", type: "fixed", value: "500", maxUses: "1", hint: "Monto fijo, un solo uso" },
  { label: "Cupón de descuento", type: "percent", value: "10", maxUses: "", hint: "Porcentaje, usos ilimitados" },
];

export default function PromoCreateForm() {
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("10");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const input = {
      code,
      discount_type: type,
      value: toNumber(value),
      min_purchase: minPurchase.trim() === "" ? 0 : toNumber(minPurchase),
      max_uses: maxUses.trim() === "" ? null : toNumber(maxUses),
    };
    const parsed = promoCreateSchema.safeParse(input);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    startTransition(async () => {
      const result = await crearCupon(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(`Código ${parsed.data.code} creado.`);
      setCode("");
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-[28px] bg-white p-6 shadow-card lg:sticky lg:top-28">
      <h2 className="text-lg font-semibold tracking-tight">Nuevo código</h2>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const Icon = preset.type === "fixed" ? Gift : TicketPercent;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setType(preset.type);
                setValue(preset.value);
                setMaxUses(preset.maxUses);
              }}
              className="rounded-[20px] border border-black/10 p-3 text-left transition-colors hover:border-accent/40"
            >
              <Icon size={16} className="text-accent" />
              <p className="mt-1.5 text-xs font-semibold">{preset.label}</p>
              <p className="text-[11px] text-muted">{preset.hint}</p>
            </button>
          );
        })}
      </div>

      <label className="block space-y-1.5">
        <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">Código</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
          placeholder="REGALO500"
          maxLength={30}
          className={`${inputClass} font-semibold uppercase tracking-wide placeholder:font-normal`}
        />
      </label>

      <div role="radiogroup" aria-label="Tipo de descuento" className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1">
        {(["percent", "fixed"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={type === option}
            onClick={() => setType(option)}
            className={`rounded-full py-2 text-sm font-semibold transition-colors ${
              type === option ? "bg-white shadow-card" : "text-muted hover:text-black"
            }`}
          >
            {option === "percent" ? "Porcentaje" : "Monto fijo"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {type === "percent" ? "Descuento (%)" : "Monto (MXN)"}
          </span>
          <input
            type="number"
            min={0}
            max={type === "percent" ? 100 : undefined}
            step={type === "percent" ? 1 : 10}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">Compra mín.</span>
          <input
            type="number"
            min={0}
            step={50}
            value={minPurchase}
            onChange={(e) => setMinPurchase(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">Usos máximos</span>
        <input
          type="number"
          min={1}
          step={1}
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Ilimitados"
          className={inputClass}
        />
        <span className="block px-2 text-xs text-muted">
          Usa 1 para tarjetas de regalo: después del primer pedido el código deja de servir.
        </span>
      </label>

      {type === "fixed" && toNumber(value) > 0 && (
        <p className="rounded-[20px] bg-canvas px-4 py-3 text-xs text-muted">
          Si el pedido es menor a {formatMXN(toNumber(value))}, el descuento se limita al subtotal y el saldo
          restante no se conserva.
        </p>
      )}

      {error && <p className="px-2 text-sm text-danger">{error}</p>}
      {notice && (
        <p className="rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/70">{notice}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "Creando…" : "Crear código"}
      </button>
    </form>
  );
}
