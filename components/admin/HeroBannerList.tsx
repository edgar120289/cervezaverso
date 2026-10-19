"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, GripVertical, ImageUp, Loader2, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { firstIssue } from "@/lib/validation";
import {
  HERO_BUCKET,
  HERO_IMAGE_TYPES,
  heroImageSchema,
  MAX_HERO_BANNERS,
  type HeroBanner,
} from "@/lib/hero";
import { DEFAULT_HERO_STYLE } from "@/lib/landing-style";

type HeroBannerListProps = {
  banners: HeroBanner[];
  onChange: (banners: HeroBanner[]) => void;
  /** Banner abierto en el lienzo del Studio (`null` si se edita otro elemento). */
  selected: number | null;
  onSelect: (index: number) => void;
};

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 transition-colors hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40";

/**
 * Banners del carrusel: subir (directo al bucket), reordenar (arrastrar o flechas), quitar y elegir cuál
 * editar en el lienzo. Textos, botones y estilo de cada banner se editan en las secciones del Studio.
 */
export default function HeroBannerList({ banners, onChange, selected, onSelect }: HeroBannerListProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFull = banners.length >= MAX_HERO_BANNERS;

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= banners.length) return;
    const next = [...banners];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
    if (selected === from) onSelect(to);
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []).slice(0, MAX_HERO_BANNERS - banners.length);
    e.target.value = "";
    if (files.length === 0) return;

    for (const file of files) {
      const parsed = heroImageSchema.safeParse(file);
      if (!parsed.success) {
        setError(`${file.name}: ${firstIssue(parsed.error)}`);
        return;
      }
    }

    setUploading(true);
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    const added: HeroBanner[] = [];
    try {
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        // Nombre único: evita que la CDN sirva una versión anterior cacheada.
        const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(HERO_BUCKET)
          .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        added.push({ image_url: supabase.storage.from(HERO_BUCKET).getPublicUrl(path).data.publicUrl, alt: "", ctas: [], style: DEFAULT_HERO_STYLE });
      }
      onChange([...banners, ...added]);
      onSelect(banners.length);
    } catch (err) {
      if (uploadedPaths.length > 0) await supabase.storage.from(HERO_BUCKET).remove(uploadedPaths);
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLLIElement>, to: number) {
    e.preventDefault();
    if (dragIndex !== null) move(dragIndex, to);
    setDragIndex(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Arrastra o usa las flechas · {banners.length}/{MAX_HERO_BANNERS}
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isFull}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
          {uploading ? "Subiendo…" : "Subir banners"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={HERO_IMAGE_TYPES.join(",")}
          onChange={handleFiles}
          className="sr-only"
          tabIndex={-1}
          aria-label="Elegir banners del carrusel"
        />
      </div>
      <p className="text-[11px] text-muted">Tamaño recomendado: 1920x1080px</p>

      {banners.length === 0 ? (
        <p className="rounded-[20px] bg-canvas px-4 py-8 text-center text-sm text-muted">
          Sin banners. Sube al menos una imagen para usar el carrusel.
        </p>
      ) : (
        <ul className="space-y-2">
          {banners.map((banner, index) => (
            <li
              key={banner.image_url}
              draggable={!uploading}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-2 rounded-[20px] border p-2 transition-opacity ${
                selected === index ? "border-accent bg-accent/5" : "border-black/10"
              } ${dragIndex === index ? "opacity-40" : ""}`}
            >
              <GripVertical size={16} aria-hidden className="hidden shrink-0 text-muted lg:block" />
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas">
                <Image
                  src={banner.image_url}
                  alt={banner.alt || `Banner ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  draggable={false}
                />
              </div>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-pressed={selected === index}
                className="flex min-h-11 flex-1 items-center gap-1.5 text-left text-sm font-semibold"
              >
                <Pencil size={14} aria-hidden />
                Banner {index + 1}
              </button>
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label={`Subir el banner ${index + 1}`}
                className={iconButton}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === banners.length - 1}
                aria-label={`Bajar el banner ${index + 1}`}
                className={iconButton}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => onChange(banners.filter((_, i) => i !== index))}
                aria-label={`Quitar el banner ${index + 1}`}
                className={`${iconButton} hover:bg-danger`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite">{error && <p className="px-2 text-sm text-danger">{error}</p>}</div>
    </div>
  );
}
