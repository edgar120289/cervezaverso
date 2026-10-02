"use client";

import { useState } from "react";
import BottleFallback from "./BottleFallback";

/** Cinemagraph genérico (cerveza sirviéndose). Ver `public/video/README.md`. */
const PRODUCT_LOOP_SRC = "/video/producto-loop.mp4";

/**
 * Fondo para cervezas sin foto individual (MASTER PROMPT V2 · Bloque 2.4):
 * video en loop con overlay oscuro y la silueta de botella encima. Si el video
 * no existe o no carga, queda un degradado oscuro con la silueta.
 */
export default function ProductVideoLoop({ className = "" }: { className?: string }) {
  const [hasVideo, setHasVideo] = useState(true);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-neutral-800 to-black ${className}`}>
      {hasVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setHasVideo(false)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={PRODUCT_LOOP_SRC} type="video/mp4" onError={() => setHasVideo(false)} />
        </video>
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center text-white/70">
        <BottleFallback className="h-2/5 w-2/5" />
      </div>
    </div>
  );
}
