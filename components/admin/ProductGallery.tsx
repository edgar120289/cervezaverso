"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, GripVertical, ImageUp, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { actualizarGaleriaProducto } from "@/app/actions/admin-productos";
import {
  firstIssue,
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_TYPES,
  productImageSchema,
} from "@/lib/validation";

type ProductGalleryProps = {
  productId: string;
  productName: string;
  sku: string;
  initialUrls: string[];
};

const tileButton =
  "flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 transition-colors hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40";

/**
 * Galería de imágenes de una cerveza. La primera es la portada. Cada cambio (subir, quitar,
 * reordenar) se guarda al instante; si falla, vuelve al estado anterior.
 * El orden se cambia arrastrando (ratón) o con las flechas (táctil y teclado).
 */
export default function ProductGallery({ productId, productName, sku, initialUrls }: ProductGalleryProps) {
  const [urls, setUrls] = useState(initialUrls);
  const [busy, setBusy] = useState<null | "saving" | "uploading">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFull = urls.length >= MAX_PRODUCT_IMAGES;

  /** Guarda la galería; si el servidor la rechaza, restaura la anterior. */
  async function persist(next: string[]): Promise<boolean> {
    const previous = urls;
    setUrls(next);
    setBusy("saving");
    try {
      const result = await actualizarGaleriaProducto(productId, next);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err) {
      setUrls(previous);
      setError(err instanceof Error ? err.message : "No se pudo guardar la galería.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= urls.length) return;
    const next = [...urls];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setError(null);
    setNotice(null);
    void persist(next);
  }

  function remove(index: number) {
    setError(null);
    setNotice(null);
    void persist(urls.filter((_, i) => i !== index));
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setNotice(null);
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PRODUCT_IMAGES - urls.length);
    e.target.value = "";
    if (files.length === 0) return;

    const valid: File[] = [];
    for (const file of files) {
      const parsed = productImageSchema.safeParse(file);
      if (!parsed.success) {
        setError(`${file.name}: ${firstIssue(parsed.error)}`);
        return;
      }
      valid.push(parsed.data);
    }

    setBusy("uploading");
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    const uploadedUrls: string[] = [];
    try {
      for (const [i, file] of valid.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        // Nombre único: evita que la CDN sirva una versión anterior cacheada.
        const path = `${sku}/${Date.now()}-${i}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        uploadedUrls.push(supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
      }
      const saved = await persist([...urls, ...uploadedUrls]);
      if (saved) setNotice(uploadedUrls.length === 1 ? "Imagen agregada." : `${uploadedUrls.length} imágenes agregadas.`);
      else await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
    } catch (err) {
      if (uploadedPaths.length > 0) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setBusy(null);
    }
  }

  function handleDrop(e: DragEvent<HTMLLIElement>, to: number) {
    e.preventDefault();
    if (dragIndex !== null) reorder(dragIndex, to);
    setDragIndex(null);
  }

  const isBusy = busy !== null;

  return (
    <section aria-labelledby="gallery-title" className="rounded-[28px] bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="gallery-title" className="font-semibold tracking-tight">
            Galería de imágenes
          </h3>
          <p className="text-xs text-muted">
            La primera es la portada. Arrastra o usa las flechas para ordenar · se guarda al instante ·{" "}
            {urls.length}/{MAX_PRODUCT_IMAGES}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || isFull}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            {busy === "uploading" ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
            {busy === "uploading" ? "Subiendo…" : "Subir imágenes"}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={PRODUCT_IMAGE_TYPES.join(",")}
          onChange={handleFiles}
          className="sr-only"
          tabIndex={-1}
          aria-label="Elegir imágenes de la cerveza"
        />
      </div>

      {urls.length === 0 ? (
        <p className="mt-4 rounded-[20px] bg-canvas px-4 py-10 text-center text-sm text-muted">
          Sin imágenes. Sube las fotos de la cerveza.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {urls.map((url, index) => (
            <li
              key={url}
              draggable={!isBusy}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              className={`space-y-2 rounded-[20px] border border-black/5 bg-white p-2 transition-opacity ${
                index === 0 ? "ring-2 ring-accent" : ""
              } ${dragIndex === index ? "opacity-40" : ""}`}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                <Image
                  src={url}
                  alt={`${productName}: foto ${index + 1}${index === 0 ? " (portada)" : ""}`}
                  fill
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                  className="object-contain p-2"
                  draggable={false}
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                    Portada
                  </span>
                )}
                <GripVertical
                  size={16}
                  aria-hidden
                  className="absolute bottom-2 right-2 hidden text-muted md:block"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => reorder(index, index - 1)}
                  disabled={isBusy || index === 0}
                  aria-label={`Mover la foto ${index + 1} a la izquierda`}
                  className={tileButton}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => reorder(index, index + 1)}
                  disabled={isBusy || index === urls.length - 1}
                  aria-label={`Mover la foto ${index + 1} a la derecha`}
                  className={tileButton}
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={isBusy}
                  aria-label={`Quitar la foto ${index + 1}`}
                  className={`${tileButton} hover:bg-danger`}
                >
                  <X size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite">
        {error && <p className="mt-3 px-2 text-sm text-danger">{error}</p>}
        {notice && (
          <p className="mt-3 rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-black/70">
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}
