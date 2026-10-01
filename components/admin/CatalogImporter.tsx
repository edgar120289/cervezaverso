"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import type { ImportResult } from "@/lib/monasterio";
import { buildTemplateCsv, TEMPLATE_FILENAME, TEMPLATE_HEADERS } from "@/lib/catalog-template";
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

export default function CatalogImporter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(candidate: File | null | undefined) {
    setResult(null);
    setError(null);
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

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(HONEYPOT_FIELD, String(new FormData(e.currentTarget).get(HONEYPOT_FIELD) ?? ""));

      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al importar el archivo.");

      setResult(data);
      clearFile();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="relative rounded-[28px] bg-white p-6 shadow-card">
      <Honeypot />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Carga masiva de catálogo</h2>
          <p className="mt-1 text-sm text-muted">
            Sube el archivo semanal (.xlsx o .csv). Las cervezas existentes actualizan precio y
            disponibilidad sin perder sus descripciones ni su imagen; las nuevas se agregan.
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!file || isLoading}
          className="min-h-12 flex-1 rounded-full bg-accent px-8 font-semibold text-white shadow-accent disabled:opacity-50"
        >
          {isLoading ? "Procesando…" : "Importar catálogo"}
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

      {error && (
        <div className="mt-3">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}

      {result && (
        <div role="status" className="mt-4 space-y-2 rounded-[20px] bg-canvas px-4 py-3 text-sm">
          <p>
            <strong>{result.inserted}</strong> cervezas nuevas · <strong>{result.updated}</strong> actualizadas
            {result.skipped > 0 && <> · {result.skipped} filas vacías omitidas</>}
          </p>
          {result.errors.length > 0 && (
            <details className="text-danger">
              <summary className="cursor-pointer font-semibold">{result.errors.length} filas con errores</summary>
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
