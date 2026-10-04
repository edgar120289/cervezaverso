"use client";

import { useState } from "react";
import Image from "next/image";
import ProductPlaceholder from "./ProductPlaceholder";

type ProductImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
};

/** Foto del producto (Supabase Storage). Sin URL, o si la imagen falla, muestra el placeholder. */
export default function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <ProductPlaceholder />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(src)}
      className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
    />
  );
}
