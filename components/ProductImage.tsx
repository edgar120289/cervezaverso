"use client";

import { useState } from "react";
import Image from "next/image";
import ProductPlaceholder from "./ProductPlaceholder";
import { productThumbUrl } from "@/lib/product-images";

type ProductImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Usa la miniatura de 480 px; si no existe (fotos viejas), cae a la original. */
  thumb?: boolean;
  className?: string;
};

const DEFAULT_CLASS = "object-contain p-3 transition-transform duration-500 group-hover:scale-105";

/** Foto del producto (Supabase Storage). Sin URL, o si la imagen falla, muestra el placeholder. */
export default function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  thumb = false,
  className = DEFAULT_CLASS,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <ProductPlaceholder />;

  const thumbSrc = thumb ? productThumbUrl(src) : src;
  // Si la miniatura falla se pide la original; solo si ésta también falla se muestra el placeholder.
  const current = failedSrc === thumbSrc && thumbSrc !== src ? src : thumbSrc;

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(current)}
      className={className}
    />
  );
}
