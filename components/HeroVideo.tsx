"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeroCta } from "@/lib/hero";
import HeroCtas from "./HeroCtas";
import HeroHeading from "./HeroHeading";

type HeroVideoProps = {
  /** Sin video (o si falla al cargar) queda un fondo gris oscuro. */
  videoSrc?: string;
  ctas: HeroCta[];
  title?: string | null;
  subtitle?: string | null;
};

export default function HeroVideo({ videoSrc, ctas, title, subtitle }: HeroVideoProps) {
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

  return (
    <section
      aria-label="Bienvenida"
      className="relative isolate flex min-h-[420px] flex-col items-center justify-center gap-8 overflow-hidden rounded-[28px] bg-neutral-900 py-12 shadow-card md:min-h-[560px]"
    >
      {hasVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          src={videoSrc}
        />
      )}
      <div aria-hidden className="absolute inset-0 z-0 bg-black/55" />
      <div aria-hidden className="absolute inset-0 z-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <HeroHeading title={title} subtitle={subtitle} />
        <HeroCtas ctas={ctas} />
      </div>
    </section>
  );
}
