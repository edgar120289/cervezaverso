"use client";

import { useState } from "react";
import Image from "next/image";
import ProductVideoLoop from "./ProductVideoLoop";

type ProductImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
};

/** Foto del producto (Supabase Storage). Sin URL, o si la imagen falla, muestra el loop de respaldo. */
export default function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <ProductVideoLoop />;

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
