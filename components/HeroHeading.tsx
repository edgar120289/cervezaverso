"use client";

import { motion, useReducedMotion } from "framer-motion";

const DEFAULT_TITLE = "El placer del deber cumplido";

type HeroHeadingProps = {
  /** Sin título configurado se muestra el lema de la marca. */
  title?: string | null;
  subtitle?: string | null;
};

/** Título (único H1 de la portada) y subtítulo; la sombra garantiza lectura sobre fondos claros. */
export default function HeroHeading({ title, subtitle }: HeroHeadingProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex max-w-3xl flex-col items-center gap-4 px-6 text-center text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.6),0_1px_3px_rgb(0_0_0/0.5)]"
    >
      <h1 className="text-balance text-4xl font-light tracking-[-0.04em] sm:text-6xl lg:text-7xl">
        {title?.trim() || DEFAULT_TITLE}
      </h1>
      {subtitle?.trim() && <p className="text-pretty text-base text-white sm:text-lg">{subtitle}</p>}
    </motion.div>
  );
}
