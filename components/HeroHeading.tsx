"use client";

import { motion, useReducedMotion } from "framer-motion";

type HeroHeadingProps = {
  /** Sin título configurado no se pinta nada visible; el H1 queda solo para lectores de pantalla. */
  title?: string | null;
  subtitle?: string | null;
};

/** Título (único H1 de la portada) y subtítulo; la sombra garantiza lectura sobre fondos claros. */
export default function HeroHeading({ title, subtitle }: HeroHeadingProps) {
  const reduceMotion = useReducedMotion();
  const heading = title?.trim();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex max-w-3xl flex-col items-center gap-4 px-6 text-center text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.6),0_1px_3px_rgb(0_0_0/0.5)]"
    >
      {heading ? (
        <h1 className="text-balance text-4xl font-light tracking-[-0.04em] sm:text-6xl lg:text-7xl">{heading}</h1>
      ) : (
        <h1 className="sr-only">Cervezaverso</h1>
      )}
      {subtitle?.trim() && <p className="text-pretty text-base text-white sm:text-lg">{subtitle}</p>}
    </motion.div>
  );
}
