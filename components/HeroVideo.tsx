"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeroCta } from "@/lib/hero";
import type { BlockStyle } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import StyledBanner from "./landing/StyledBanner";

type HeroVideoProps = {
  /** Sin video (o si falla al cargar) queda un fondo gris oscuro. */
  videoSrc?: string;
  ctas: HeroCta[];
  title?: string | null;
  subtitle?: string | null;
  style: BlockStyle;
  product?: Product | null;
};

export default function HeroVideo({ videoSrc, ctas, title, subtitle, style, product }: HeroVideoProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  // Con "reducir movimiento" no se reproduce video de fondo.
  const hasVideo = Boolean(videoSrc) && !videoFailed && !reduceMotion;

  // Regla de rendimiento obligatoria: un video fuera de pantalla gasta CPU y batería, así que siempre
  // se pausa al salir del viewport y se reanuda al volver (no depende de la configuración).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [hasVideo]);

  const media = hasVideo ? (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={() => setVideoFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
      src={videoSrc}
    />
  ) : undefined;

  return (
    <StyledBanner
      headingTag="div"
      ariaLabel="Bienvenida"
      title={title}
      subtitle={subtitle}
      ctas={ctas}
      style={style}
      media={media}
      product={product}
      tall={style.spotlight.enabled && Boolean(product)}
    />
  );
}
