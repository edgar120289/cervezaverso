"use client";

import { useCallback, useRef, useState } from "react";
import ProductImage from "./ProductImage";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

const SIZES = "(min-width: 768px) 560px, 100vw";

/**
 * Galería de la ficha: en móvil, carrusel con swipe y puntos; desde 768 px,
 * imagen principal con cuadrícula de miniaturas. Ambas vistas comparten `sizes`
 * para que la imagen prioritaria se precargue una sola vez.
 */
export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [desktopIndex, setDesktopIndex] = useState(0);
  const hasMany = images.length > 1;

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setMobileIndex(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-white">
        <ProductImage src={null} alt={alt} sizes={SIZES} />
      </div>
    );
  }

  return (
    <div>
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          role="group"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${alt}`}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[20px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => (
            <div
              key={src}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${images.length}`}
              className="relative aspect-square w-full shrink-0 snap-center"
            >
              <ProductImage src={src} alt={`${alt} (${index + 1})`} sizes={SIZES} priority={index === 0} />
            </div>
          ))}
        </div>
        {hasMany && (
          <div className="mt-2 flex justify-center">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ir a la foto ${index + 1}`}
                aria-current={index === mobileIndex}
                className="group flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    index === mobileIndex ? "w-5 bg-black" : "w-2 bg-black/25"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-white">
          <ProductImage
            key={images[desktopIndex]}
            src={images[desktopIndex]}
            alt={desktopIndex === 0 ? alt : `${alt} (${desktopIndex + 1})`}
            sizes={SIZES}
            priority={desktopIndex === 0}
          />
        </div>
        {hasMany && (
          <ul className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, index) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setDesktopIndex(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={index === desktopIndex}
                  className={`relative block aspect-square w-full overflow-hidden rounded-2xl bg-white ring-2 transition-shadow ${
                    index === desktopIndex ? "ring-black" : "ring-black/10 hover:ring-black/30"
                  }`}
                >
                  <ProductImage src={src} alt="" sizes="96px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
