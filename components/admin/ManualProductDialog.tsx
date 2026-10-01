"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { crearProducto } from "@/app/actions/admin-productos";
import { calculateSalePrice, DEFAULT_MARGIN_PCT, formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import type { StockStatus } from "@/lib/types";
import FormField, { INPUT_CLASS } from "@/components/FormField";
import FormMessage from "@/components/FormMessage";

type FormState = {
  name: string;
  brewery: string;
  country: string;
  style: string;
  abv: string;
  volume_ml: string;
  cost_price: string;
  margin_pct: string;
  stock_status: StockStatus;
};

const EMPTY_FORM: FormState = {
  name: "",
  brewery: "",
  country: "",
  style: "",
  abv: "",
  volume_ml: "",
  cost_price: "",
  margin_pct: String(DEFAULT_MARGIN_PCT),
  stock_status: "in_stock",
};

function toNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

export default function ManualProductDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = toNumber(form.cost_price);
  const margin = toNumber(form.margin_pct);
  const salePrice = cost >= 0 && margin >= 0 ? calculateSalePrice(cost, margin) : null;

  function update<K extends keyof FormState>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));
  }

  function open() {
    setForm(EMPTY_FORM);
    setError(null);
    dialogRef.current?.showModal();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const result = await crearProducto({
        name: form.name,
        brewery: form.brewery,
        country: form.country,
        style: form.style,
        abv: form.abv.trim() === "" ? 0 : toNumber(form.abv),
        volume_ml: form.volume_ml.trim() === "" ? 0 : toNumber(form.volume_ml),
        cost_price: cost,
        margin_pct: margin,
        stock_status: form.stock_status,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("No se pudo guardar la cerveza. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
      >
        <Plus size={16} />
        Añadir cerveza manualmente
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="manual-product-title"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-[28px] bg-white p-0 shadow-card backdrop:bg-black/40"
      >
        <form onSubmit={handleSubmit} noValidate className="max-h-[90dvh] space-y-5 overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="manual-product-title" className="text-xl font-semibold tracking-tight">
                Añadir cerveza manualmente
              </h2>
              <p className="mt-1 text-sm text-muted">
                La descripción, la ficha del Sommelier y la imagen se agregan después desde Editar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField id="mp-name" label="Nombre">
                <input id="mp-name" value={form.name} onChange={update("name")} className={INPUT_CLASS} required maxLength={160} />
              </FormField>
            </div>
            <FormField id="mp-country" label="País">
              <input id="mp-country" value={form.country} onChange={update("country")} className={INPUT_CLASS} required maxLength={80} />
            </FormField>
            <FormField id="mp-style" label="Estilo">
              <input id="mp-style" value={form.style} onChange={update("style")} className={INPUT_CLASS} required maxLength={120} />
            </FormField>
            <FormField id="mp-brewery" label="Cervecería (opcional)">
              <input id="mp-brewery" value={form.brewery} onChange={update("brewery")} className={INPUT_CLASS} maxLength={160} />
            </FormField>
            <FormField id="mp-stock" label="Disponibilidad">
              <select id="mp-stock" value={form.stock_status} onChange={update("stock_status")} className={INPUT_CLASS}>
                {(Object.keys(STOCK_STATUS_LABEL) as StockStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STOCK_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="mp-abv" label="ABV (%)">
              <input id="mp-abv" type="number" inputMode="decimal" step="0.01" min="0" max="99.99" value={form.abv} onChange={update("abv")} className={INPUT_CLASS} />
            </FormField>
            <FormField id="mp-volume" label="Volumen (ml)">
              <input id="mp-volume" type="number" inputMode="numeric" step="1" min="0" value={form.volume_ml} onChange={update("volume_ml")} className={INPUT_CLASS} />
            </FormField>
            <FormField id="mp-cost" label="Precio de costo (MXN)">
              <input id="mp-cost" type="number" inputMode="decimal" step="0.01" min="0" value={form.cost_price} onChange={update("cost_price")} className={INPUT_CLASS} required />
            </FormField>
            <FormField id="mp-margin" label="Margen (%)" hint={`Por defecto ${DEFAULT_MARGIN_PCT}%.`}>
              <input id="mp-margin" type="number" inputMode="decimal" step="0.5" min="0" max="500" value={form.margin_pct} onChange={update("margin_pct")} className={INPUT_CLASS} />
            </FormField>
          </div>

          <p className="rounded-[20px] bg-canvas px-4 py-3 text-sm" aria-live="polite">
            Precio de venta:{" "}
            <strong className="tabular-nums">
              {salePrice === null || Number.isNaN(salePrice) ? "—" : formatMXN(salePrice)}
            </strong>
          </p>

          {error && <FormMessage tone="error">{error}</FormMessage>}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-12 w-full rounded-full bg-accent font-semibold text-white shadow-accent disabled:opacity-60"
          >
            {isSaving ? "Guardando…" : "Añadir al catálogo"}
          </button>
        </form>
      </dialog>
    </>
  );
}
