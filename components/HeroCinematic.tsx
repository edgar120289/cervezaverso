"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Video sólo en pantallas ≥768 px y sin "ahorro de datos": en móvil son 4.8 MB y decodificación continua. */
function useCanPlayVideo(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      return window.matchMedia(DESKTOP_QUERY).matches && !connection?.saveData;
    },
    () => false,
  );
}

type HeroCinematicProps = {
  /** Video de fondo; sin él (o si falla al cargar) se usa un fondo gris oscuro. */
  videoSrc?: string;
};

export default function HeroCinematic({ videoSrc }: HeroCinematicProps) {
  const reduceMotion = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  // Con "reducir movimiento" no se reproduce video de fondo.
  const canPlayVideo = useCanPlayVideo();
  const hasVideo = Boolean(videoSrc) && !videoFailed && !reduceMotion && canPlayVideo;

  return (
    <section
      aria-label="Bienvenida"
      className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] bg-neutral-900 shadow-card md:min-h-[560px]"
    >
      {hasVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
          className="object-cover w-full h-full absolute inset-0 z-0"
          src={videoSrc}
        />
      )}
      <div aria-hidden className="absolute inset-0 z-0 bg-black/55" />

      <motion.h1
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl text-balance px-6 text-center text-4xl font-light tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
      >
        El placer del deber cumplido
      </motion.h1>
    </section>
  );
}
