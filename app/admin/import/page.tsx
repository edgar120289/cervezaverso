"use client";

import { useState, type FormEvent } from "react";
import { UploadCloud } from "lucide-react";
import type { ImportResult } from "@/lib/monasterio";
import { excelUploadSchema, firstIssue, HONEYPOT_FIELD } from "@/lib/validation";
import Honeypot from "@/components/Honeypot";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parsed = excelUploadSchema.safeParse({ file });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", parsed.data.file);
      formData.append(HONEYPOT_FIELD, String(new FormData(e.currentTarget).get(HONEYPOT_FIELD) ?? ""));

      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar el archivo.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleUpload} className="relative rounded-[28px] bg-white p-6 shadow-card">
        <Honeypot />
        <h2 className="text-lg font-semibold tracking-tight">Importar &ldquo;LISTA MONASTERIO&rdquo;</h2>
        <p className="mt-1 text-sm text-muted">
          Lee la pestaña <code className="rounded bg-canvas px-1.5 py-0.5">LISTA MONASTERIO</code>,
          desde la fila 12. El precio de venta se calcula con margen del 50%
          redondeado hacia abajo al múltiplo de 5.
        </p>

        <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-[20px] bg-canvas px-6 py-10 text-center transition-colors hover:bg-black/5">
          <UploadCloud className="text-muted" size={28} />
          <span className="text-sm font-semibold">
            {file ? file.name : "Selecciona un archivo .xlsx"}
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="submit"
          disabled={!file || isLoading}
          className="mt-5 w-full rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent disabled:opacity-50"
        >
          {isLoading ? "Procesando…" : "Importar catálogo"}
        </button>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        {result && (
          <div className="mt-4 space-y-1 rounded-[20px] bg-canvas px-4 py-3 text-sm">
            <p>✅ {result.inserted} productos nuevos</p>
            <p>🔄 {result.updated} productos actualizados</p>
            {result.skipped > 0 && <p>⏭️ {result.skipped} filas omitidas</p>}
            {result.errors.length > 0 && (
              <p className="text-danger">{result.errors.length} errores</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
