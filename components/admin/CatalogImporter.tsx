"use client";

import { useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import type { CatalogPlan, ImportResult, PlannedUpdate } from "@/lib/catalog-plan";
import { buildTemplateCsv, TEMPLATE_FILENAME, TEMPLATE_HEADERS } from "@/lib/catalog-template";
import { formatMXN, STOCK_STATUS_LABEL } from "@/lib/pricing";
import { catalogUploadSchema, firstIssue, HONEYPOT_FIELD } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";
import FormMessage from "@/components/FormMessage";

function downloadTemplate() {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = TEMPLATE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

const FIELD_LABEL = { country: "País", style: "Estilo", abv: "ABV" } as const;

const volume = (ml: number | null) => (ml ? ` · ${ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`}` : "");

/** Sección plegable de la vista previa; no se pinta si está vacía. */
function PreviewGroup({
  title,
  count,
  tone = "neutral",
  open = false,
  children,
}: {
  title: string;
  count: number;
  tone?: "neutral" | "warn" | "danger";
  open?: boolean;
  children: ReactNode;
}) {
  if (count === 0) return null;
  const toneClass = tone === "danger" ? "text-danger" : tone === "warn" ? "text-amber-700" : "";
  return (
    <details open={open} className="rounded-[20px] bg-canvas px-4 py-3">
      <summary className={`cursor-pointer text-sm font-semibold ${toneClass}`}>
        {title} <span className="tabular-nums">({count})</span>
      </summary>
      <div className="mt-3 max-h-80 overflow-y-auto text-sm">{children}</div>
    </details>
  );
}

function PriceRow({ update }: { update: PlannedUpdate }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        {update.name}
        <span className="text-muted">{volume(update.volume_ml)}</span>
      </span>
      <span className="shrink-0 tabular-nums">
        {formatMXN(update.price.from)} → <strong>{formatMXN(update.price.to)}</strong>
      </span>
    </li>
  );
}

export default function CatalogImporter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<CatalogPlan | null>(null);
  const [retire, setRetire] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!plan) return null;
    const changed = plan.updates.filter((u) => Object.keys(u.changes).length > 0);
    return {
      changed,
      unchanged: plan.updates.length - changed.length,
      priceUp: changed.filter((u) => u.price.to > u.price.from),
      priceDown: changed.filter((u) => u.price.to < u.price.from),
      soldOut: plan.updates.filter((u) => u.stock.to === "out_of_stock" && u.stock.from !== "out_of_stock"),
      restocked: plan.updates.filter((u) => u.stock.from === "out_of_stock" && u.stock.to !== "out_of_stock"),
      reactivated: plan.updates.filter((u) => !u.active.from && u.active.to),
      info: plan.updates.filter((u) => u.info.length > 0),
    };
  }, [plan]);

  function clearFile() {
    setFile(null);
    setPlan(null);
    setRetire(new Set());
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(candidate: File | null | undefined) {
    setResult(null);
    setError(null);
    setPlan(null);
    setRetire(new Set());
    if (!candidate) return;
    const parsed = catalogUploadSchema.safeParse({ file: candidate });
    if (!parsed.success) {
      clearFile();
      setError(firstIssue(parsed.error));
      return;
    }
    setFile(parsed.data.file);
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setIsDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  async function send(mode: "preview" | "apply") {
    if (!file || !formRef.current) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    formData.append(HONEYPOT_FIELD, String(new FormData(formRef.current).get(HONEYPOT_FIELD) ?? ""));
    if (mode === "apply" && plan) {
      formData.append("fingerprint", plan.fingerprint);
      formData.append("retire", JSON.stringify([...retire]));
    }
    const res = await fetch("/api/admin/import", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error ?? "Error al procesar el archivo.");
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    return data;
  }

  async function handlePreview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const data = await send("preview");
      if (data) {
        setPlan(data.plan);
        setRetire(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApply() {
    setError(null);
    setIsLoading(true);
    try {
      const data = await send("apply");
      if (data) {
        setResult(data.result);
        clearFile();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      // Si el catálogo cambió (409), la vista previa ya no sirve.
      if ((err as { status?: number }).status === 409) setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleRetire(id: string) {
    setRetire((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const nothingToApply =
    plan &&
    groups &&
    plan.news.length === 0 &&
    groups.changed.length === 0 &&
    plan.missing.length === 0 &&
    plan.tagProvider.length === 0 &&
    retire.size === 0;

  return (
    <form ref={formRef} onSubmit={handlePreview} className="relative rounded-[28px] bg-white p-6 shadow-card">
      <Honeypot />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Carga masiva de catálogo</h2>
          <p className="mt-1 text-sm text-muted">
            Sube el archivo semanal (.xlsx o .csv) y revisa los cambios antes de aplicarlos. Las cervezas
            nuevas entran como <strong>pendientes</strong> (inactivas) y las <strong>retiradas</strong> no
            se tocan.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-canvas px-5 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
        >
          <Download size={16} />
          Descargar plantilla
        </button>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-accent ${
          isDragging ? "border-accent bg-accent/5" : "border-black/10 bg-canvas hover:bg-black/5"
        }`}
      >
        {file ? <FileSpreadsheet className="text-accent" size={28} /> : <UploadCloud className="text-muted" size={28} />}
        <span className="text-sm font-semibold">
          {file ? file.name : "Arrastra tu archivo aquí o haz clic para elegirlo"}
        </span>
        <span className="text-xs text-muted">.xlsx o .csv · máximo 10 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>

      <p className="mt-3 px-2 text-xs text-muted">
        Columnas de la plantilla: {TEMPLATE_HEADERS.join(", ")}. <strong>Precio</strong> es el costo
        del proveedor (el precio de venta se calcula con el margen). <strong>Stock</strong> acepta
        un número (0 = agotada, hasta 5 = pocas piezas) o Disponible, Pocas piezas, Agotada, Preventa.
      </p>

      {!plan && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={!file || isLoading}
            className="min-h-12 flex-1 rounded-full bg-accent px-8 font-semibold text-white shadow-accent disabled:opacity-50"
          >
            {isLoading ? "Revisando…" : "Revisar cambios"}
          </button>
          {file && !isLoading && (
            <button
              type="button"
              onClick={clearFile}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-canvas px-6 text-sm font-semibold"
            >
              <X size={16} />
              Quitar archivo
            </button>
          )}
        </div>
      )}

      {plan && groups && (
        <section aria-label="Vista previa de la carga" className="mt-6 space-y-3">
          <h3 className="text-base font-semibold tracking-tight">Vista previa: todavía no se ha guardado nada</h3>
          <p className="text-sm text-muted">
            {plan.news.length} nuevas · {groups.changed.length} con cambios · {groups.unchanged} sin cambios
            {plan.ignored.length > 0 && <> · {plan.ignored.length} retiradas ignoradas</>}
            {plan.skipped > 0 && <> · {plan.skipped} filas vacías</>}
          </p>

          <PreviewGroup
            title="Se volverían a activar: marca las que no quieres de vuelta"
            count={groups.reactivated.length}
            tone="warn"
            open
          >
            <p className="mb-2 text-xs text-muted">
              Estaban inactivas y el archivo las trae con existencia. Las que marques como «Retirar» quedan
              inactivas para siempre (la carga ya no las vuelve a activar) y no cambian su precio.
            </p>
            <div className="mb-2 flex gap-3 text-xs font-semibold">
              <button type="button" className="text-accent hover:underline" onClick={() => setRetire(new Set(groups.reactivated.map((u) => u.id)))}>
                Marcar todas
              </button>
              <button type="button" className="text-accent hover:underline" onClick={() => setRetire(new Set())}>
                Desmarcar todas
              </button>
            </div>
            <ul className="space-y-1.5">
              {groups.reactivated.map((u) => (
                <li key={u.id}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      id={`retirar-${u.id}`}
                      type="checkbox"
                      checked={retire.has(u.id)}
                      onChange={() => toggleRetire(u.id)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span>
                      Retirar <strong>{u.name}</strong>
                      <span className="text-muted">{volume(u.volume_ml)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Nuevas (entran como pendientes, sin publicarse)" count={plan.news.length}>
            <ul className="space-y-1">
              {plan.news.map((n) => (
                <li key={`${n.rowNumber}-${n.name}`} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    {n.name}
                    <span className="text-muted">
                      {" "}· {n.country}
                      {volume(n.volume_ml)}
                      {n.brewery ? ` · ${n.brewery}` : " · sin cervecería"}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatMXN(n.sale_price)}</span>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Precio sube" count={groups.priceUp.length}>
            <ul className="space-y-1">{groups.priceUp.map((u) => <PriceRow key={u.id} update={u} />)}</ul>
          </PreviewGroup>

          <PreviewGroup title="Precio baja" count={groups.priceDown.length}>
            <ul className="space-y-1">{groups.priceDown.map((u) => <PriceRow key={u.id} update={u} />)}</ul>
          </PreviewGroup>

          <PreviewGroup title="Se agotan" count={groups.soldOut.length}>
            <ul className="space-y-1">
              {groups.soldOut.map((u) => (
                <li key={u.id}>
                  {u.name}
                  <span className="text-muted">{volume(u.volume_ml)}</span>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Vuelven a tener existencia" count={groups.restocked.length}>
            <ul className="space-y-1">
              {groups.restocked.map((u) => (
                <li key={u.id}>
                  {u.name}
                  <span className="text-muted">
                    {volume(u.volume_ml)} · {STOCK_STATUS_LABEL[u.stock.to]}
                    {u.pendiente && " · pendiente (sigue inactiva)"}
                  </span>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Ya no vienen en la lista de Monasterio (pasan a «Agotada»)" count={plan.missing.length} tone="warn">
            <ul className="space-y-1">
              {plan.missing.map((m) => (
                <li key={m.id}>
                  {m.name}
                  <span className="text-muted">
                    {volume(m.volume_ml)} · hoy {STOCK_STATUS_LABEL[m.stockFrom]}
                  </span>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="El archivo trae otro país, estilo o ABV (no se cambia)" count={groups.info.length}>
            <ul className="space-y-1">
              {groups.info.flatMap((u) =>
                u.info.map((d) => (
                  <li key={`${u.id}-${d.field}`}>
                    {u.name}: {FIELD_LABEL[d.field]} actual <strong>{d.current}</strong>, en el archivo «{d.file}»
                  </li>
                ))
              )}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Retiradas que vienen en el archivo (se ignoran)" count={plan.ignored.length}>
            <ul className="space-y-1">
              {plan.ignored.map((i) => (
                <li key={i.id}>
                  {i.name}
                  <span className="text-muted">{volume(i.volume_ml)}</span>
                </li>
              ))}
            </ul>
          </PreviewGroup>

          <PreviewGroup title="Filas con avisos o errores" count={plan.errors.length} tone="danger">
            <ul className="list-disc space-y-1 pl-5">
              {plan.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </PreviewGroup>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading || Boolean(nothingToApply)}
              className="min-h-12 flex-1 rounded-full bg-accent px-8 font-semibold text-white shadow-accent disabled:opacity-50"
            >
              {isLoading ? "Aplicando…" : nothingToApply ? "No hay cambios que aplicar" : "Aplicar cambios"}
            </button>
            <button
              type="button"
              onClick={clearFile}
              disabled={isLoading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-canvas px-6 text-sm font-semibold disabled:opacity-50"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="mt-3">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}

      {result && (
        <div role="status" className="mt-4 space-y-2 rounded-[20px] bg-canvas px-4 py-3 text-sm">
          <p>
            <strong>{result.inserted}</strong> nuevas como pendientes · <strong>{result.updated}</strong> actualizadas
            {result.unchanged > 0 && <> · {result.unchanged} sin cambios</>}
            {result.retired > 0 && <> · {result.retired} retiradas</>}
            {result.markedOutOfStock > 0 && <> · {result.markedOutOfStock} pasaron a agotadas</>}
            {result.ignored > 0 && <> · {result.ignored} retiradas ignoradas</>}
            {result.skipped > 0 && <> · {result.skipped} filas vacías omitidas</>}
          </p>
          {result.inserted > 0 && (
            <p>
              <Link href="/admin?estado=pending" className="font-semibold text-accent hover:underline">
                Ver las pendientes
              </Link>{" "}
              para ponerles foto y cervecería y activarlas.
            </p>
          )}
          {result.errors.length > 0 && (
            <details className="text-danger">
              <summary className="cursor-pointer font-semibold">{result.errors.length} avisos o errores</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </form>
  );
}
