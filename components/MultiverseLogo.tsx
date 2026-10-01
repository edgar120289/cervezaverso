"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const FALLBACK_JARS = [
  "/multiverso/jar-1.svg",
  "/multiverso/jar-2.svg",
  "/multiverso/jar-3.svg",
];

function pickRandom(options: string[], exclude?: string) {
  const pool = options.length > 1 ? options.filter((jar) => jar !== exclude) : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

type MultiverseLogoProps = {
  /** Tarros que rotan (leídos de `public/img/` en el servidor). */
  images?: string[];
  /** Marco fijo sobre el que rota el tarro (p. ej. el logo circular). */
  frame?: string;
  size?: number;
  /** Si se define, el tarro cambia solo cada `autoCycleMs` milisegundos. */
  autoCycleMs?: number;
  priority?: boolean;
};

export default function MultiverseLogo({
  images,
  frame,
  size = 44,
  autoCycleMs,
  priority = false,
}: MultiverseLogoProps) {
  const jars = images && images.length > 0 ? images : FALLBACK_JARS;
  // El primer render es determinista (igual en servidor y cliente) para evitar
  // mismatch de hidratación; el tarro aleatorio se elige tras montar.
  const [jar, setJar] = useState(jars[0]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJar((current) => pickRandom(jars, current));
    if (!autoCycleMs || reduceMotion) return;
    const id = window.setInterval(() => setJar((current) => pickRandom(jars, current)), autoCycleMs);
    return () => window.clearInterval(id);
  }, [jars, autoCycleMs, reduceMotion]);

  return (
    <button
      type="button"
      aria-label="Cervezaverso"
      onMouseEnter={() => setJar((current) => pickRandom(jars, current))}
      onClick={() => setJar((current) => pickRandom(jars, current))}
      className="relative flex shrink-0 cursor-pointer items-center justify-center"
      style={{ width: size, height: size }}
    >
      {frame && (
        <Image src={frame} alt="" fill sizes={`${size}px`} priority={priority} className="object-contain" />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={jar}
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image src={jar} alt="" fill sizes={`${size}px`} quality={100} priority={priority} className="object-contain" />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
