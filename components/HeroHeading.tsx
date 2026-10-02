"use client";

import { motion, useReducedMotion } from "framer-motion";

/** El lema de la marca, único H1 de la portada. */
export default function HeroHeading() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.h1
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl text-balance px-6 text-center text-4xl font-light tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
    >
      El placer del deber cumplido
    </motion.h1>
  );
}
