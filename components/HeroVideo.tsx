"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeroCta } from "@/lib/hero";
import HeroCtas from "./HeroCtas";
import HeroHeading from "./HeroHeading";

type HeroVideoProps = {
  /** Sin video (o si falla al cargar) queda un fondo gris oscuro. */
  videoSrc?: string;
  /** Pausa el video cuando sale del viewport y lo reanuda al volver. */
  autoPause: boolean;
  ctas: HeroCta[];
};

export default function HeroVideo({ videoSrc, autoPause, ctas }: HeroVideoProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  // Con "reducir movimiento" no se reproduce video de fondo.
  const hasVideo = Boolean(videoSrc) && !videoFailed && !reduceMotion;

  // Un video fuera de pantalla sigue gastando CPU y batería: se pausa al salir y se reanuda al volver.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPause) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPause, hasVideo]);

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

      <div className="relative z-10 flex flex-col items-center gap-8">
        <HeroHeading />
        <HeroCtas ctas={ctas} />
      </div>
    </section>
  );
}
