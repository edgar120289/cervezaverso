"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { actualizarProducto } from "@/app/actions/admin-productos";
import { calculateSalePrice, DEFAULT_MARGIN_PCT, formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import ProductGallery from "./ProductGallery";
import type { Product, StockStatus } from "@/lib/types";

const inputClass =
  "w-full rounded-full bg-canvas px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15";
const textareaClass =
  "w-full rounded-[20px] bg-canvas px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="block px-2 text-xs text-muted">{hint}</span>}
    </label>
  );
}

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
  badges: string;
  description_ai: string;
  pairing_ai: string;
  notas_origen: string;
  notas_perfil: string;
  notas_maridaje: string;
};

type SommelierNotes = { origen: string; perfil: string; maridaje: string };

function toNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

export default function ProductEditForm({
  product,
  initialMargin,
  initialImages,
}: {
  product: Product;
  initialMargin: number;
  initialImages: string[];
}) {
  const [form, setForm] = useState<FormState>({
    name: product.name,
    brewery: product.brewery ?? "",
    country: product.country,
    style: product.style,
    abv: String(product.abv),
    volume_ml: String(product.volume_ml),
    cost_price: String(product.cost_price),
    margin_pct: String(initialMargin),
    stock_status: product.stock_status,
    badges: product.badges.join(", "),
    description_ai: product.description_ai ?? "",
    pairing_ai: product.pairing_ai ?? "",
    notas_origen: product.notas_origen ?? "",
    notas_perfil: product.notas_perfil ?? "",
    notas_maridaje: product.notas_maridaje ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cost = toNumber(form.cost_price);
  const margin = toNumber(form.margin_pct);
  const salePrice =
    Number.isFinite(cost) && Number.isFinite(margin) && cost >= 0 && margin >= 0
      ? calculateSalePrice(cost, margin)
      : null;

  function update<K extends keyof FormState>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));
  }

  async function handleGenerate() {
    setError(null);
    setNotice(null);
    if (!form.name.trim() || !form.style.trim() || !form.country.trim()) {
      setError("Llena el nombre, estilo y país antes de generar la ficha.");
      return;
    }
    const hasNotes = [form.notas_origen, form.notas_perfil, form.notas_maridaje].some((v) => v.trim());
    if (hasNotes && !window.confirm("Esto reemplazará las notas del Sommelier que ya escribiste. ¿Continuar?")) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, style: form.style, country: form.country }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar la descripción.");

      const notes = data as SommelierNotes;
      setForm((current) => ({
        ...current,
        notas_origen: notes.origen,
        notas_perfil: notes.perfil,
        notas_maridaje: notes.maridaje,
      }));
      setNotice("Ficha generada. Revísala, edítala si quieres y pulsa “Guardar cambios”.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la descripción.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);
    try {
      const result = await actualizarProducto({
        id: product.id,
        name: form.name,
        brewery: form.brewery,
        country: form.country,
        style: form.style,
        abv: toNumber(form.abv),
        volume_ml: toNumber(form.volume_ml),
        cost_price: cost,
        margin_pct: margin,
        stock_status: form.stock_status,
        badges: form.badges.split(",").map((badge) => badge.trim()).filter(Boolean),
        description_ai: form.description_ai,
        pairing_ai: form.pairing_ai,
        notas_origen: form.notas_origen,
        notas_perfil: form.notas_perfil,
        notas_maridaje: form.notas_maridaje,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(`Cambios guardados. Precio de venta: ${formatMXN(result.sale_price ?? 0)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="lg:col-span-2">
        <ProductGallery
          productId={product.id}
          productName={product.name}
          sku={product.sku}
          initialUrls={initialImages}
        />
      </div>

      <div className="space-y-4">
        {/* Precio */}
        <div className="rounded-[28px] bg-white p-6 shadow-card">
          <p className="text-sm text-muted">Precio de venta</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {salePrice === null ? "—" : formatMXN(salePrice)}
          </p>
          <p className="mt-2 text-xs text-muted">
            Costo × (1 + margen) redondeado hacia abajo al múltiplo de $5.
          </p>
        </div>
      </div>

      {/* Datos */}
      <div className="space-y-6 rounded-[28px] bg-white p-6 shadow-card sm:p-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{product.name}</h2>
          <p className="mt-1 text-xs text-muted">SKU: {product.sku}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input value={form.name} onChange={update("name")} className={inputClass} required />
          </Field>
          <Field label="Cervecería">
            <input value={form.brewery} onChange={update("brewery")} className={inputClass} />
          </Field>
          <Field label="País">
            <input value={form.country} onChange={update("country")} className={inputClass} required />
          </Field>
          <Field label="Estilo">
            <input value={form.style} onChange={update("style")} className={inputClass} required />
          </Field>
          <Field label="ABV (%)">
            <input type="number" step="0.01" min="0" value={form.abv} onChange={update("abv")} className={inputClass} />
          </Field>
          <Field label="Volumen (ml)">
            <input type="number" step="1" min="0" value={form.volume_ml} onChange={update("volume_ml")} className={inputClass} />
          </Field>
          <Field label="Disponibilidad">
            <select value={form.stock_status} onChange={update("stock_status")} className={inputClass}>
              {(Object.keys(STOCK_STATUS_LABEL) as StockStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STOCK_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Insignias" hint="Separadas por comas.">
            <input value={form.badges} onChange={update("badges")} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-4 rounded-[20px] border border-accent/20 bg-accent/5 p-4 sm:grid-cols-2">
          <Field label="Costo (MXN)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={update("cost_price")}
              className={`${inputClass} bg-white`}
            />
          </Field>
          <Field
            label="Margen de Utilidad Personalizado (%)"
            hint={`Por defecto ${DEFAULT_MARGIN_PCT}%. El precio se recalcula al instante.`}
          >
            <input
              type="number"
              step="0.5"
              min="0"
              max="500"
              value={form.margin_pct}
              onChange={update("margin_pct")}
              className={`${inputClass} bg-white`}
            />
          </Field>
        </div>

        <div className="grid gap-4">
          <Field label="Descripción">
            <textarea rows={3} value={form.description_ai} onChange={update("description_ai")} className={textareaClass} />
          </Field>
          <Field label="Maridaje (resumen)">
            <textarea rows={2} value={form.pairing_ai} onChange={update("pairing_ai")} className={textareaClass} />
          </Field>
        </div>

        <div className="space-y-4 rounded-[20px] border border-accent/20 bg-accent/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold tracking-tight">Ficha del Sommelier Digital</p>
              <p className="text-xs text-muted">Se muestra en la página de la cerveza.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || isSaving}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#5433eb] via-[#7b5cf5] to-[#5433eb] bg-[length:200%_100%] px-5 py-3 text-sm font-semibold text-white shadow-accent transition-all hover:bg-right active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? "El Sommelier está escribiendo…" : "✨ Generar descripción con IA (Sommelier)"}
            </button>
          </div>
          <fieldset disabled={isGenerating} className="grid gap-4 transition-opacity disabled:opacity-50">
            <Field label="El Origen">
              <textarea rows={3} value={form.notas_origen} onChange={update("notas_origen")} className={`${textareaClass} bg-white`} />
            </Field>
            <Field label="Perfil Sensorial">
              <textarea rows={4} value={form.notas_perfil} onChange={update("notas_perfil")} className={`${textareaClass} bg-white`} />
            </Field>
            <Field label="El Maridaje Perfecto">
              <textarea rows={3} value={form.notas_maridaje} onChange={update("notas_maridaje")} className={`${textareaClass} bg-white`} />
            </Field>
          </fieldset>
        </div>

        {error && <p className="px-2 text-sm text-danger">{error}</p>}
        {notice && (
          <p className="rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/70">{notice}</p>
        )}

        <button
          type="submit"
          disabled={isSaving || isGenerating}
          className="w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
