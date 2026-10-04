"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageUp, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { firstIssue } from "@/lib/validation";
import { HERO_BUCKET, HERO_IMAGE_TYPES, heroImageSchema } from "@/lib/hero";

type ImageUploadFieldProps = {
  label: string;
  /** Medida recomendada, por ejemplo "800x800px". */
  recommended: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Miniatura cuadrada (íconos) en lugar de panorámica. */
  compact?: boolean;
};

/** Sube una imagen directo al bucket de la landing; el guardado del formulario confirma el cambio. */
export default function ImageUploadField({ label, recommended, value, onChange, compact = false }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const parsed = heroImageSchema.safeParse(file);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(HERO_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError) throw uploadError;
      onChange(supabase.storage.from(HERO_BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex items-center gap-3">
        <div
          className={`relative shrink-0 overflow-hidden rounded-2xl bg-canvas ring-1 ring-black/10 ${
            compact ? "h-14 w-14" : "aspect-video w-40"
          }`}
        >
          {value && <Image src={value} alt="" fill sizes="160px" className="object-cover" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Quitar: ${label}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 hover:bg-danger hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={HERO_IMAGE_TYPES.join(",")}
          onChange={handleFile}
          className="sr-only"
          tabIndex={-1}
          aria-label={label}
        />
      </div>
      <p className="text-[11px] text-muted">Tamaño recomendado: {recommended}</p>
      <div aria-live="polite">{error && <p className="text-sm text-danger">{error}</p>}</div>
    </div>
  );
}
