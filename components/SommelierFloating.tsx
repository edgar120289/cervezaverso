"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SOMMELIER_MASCOT } from "@/lib/site";
import { useSommelier } from "./SommelierProvider";

const MESSAGES = ["¿Qué cerveza elegir?", "Yo te ayudo a elegir cerveza"];
const SWAP_MS = 4000;
/** Solo donde se compra. El estado del quiz vive en `SommelierProvider` (layout), así que sobrevive a la navegación. */
const FLOATING_ROUTES = ["/tienda", "/carrito", "/checkout"];

/** Sommelier flotante estilo chatbot: alterna dos frases y abre el quiz al pulsarlo. */
export default function SommelierFloating() {
  const { openQuiz } = useSommelier();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), SWAP_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  if (!FLOATING_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;

  return (
    <button
      type="button"
      onClick={openQuiz}
      aria-label="Abrir el Sommelier: te ayudo a elegir cerveza"
      className="fixed bottom-24 right-4 z-50 flex items-end gap-2 sm:right-6"
    >
      <span
        aria-hidden
        className="relative mb-3 grid rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-left text-xs font-semibold shadow-card"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="block max-w-[9.5rem]"
          >
            {MESSAGES[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white shadow-card ring-2 ring-accent transition-transform hover:scale-105 active:scale-95">
        <Image src={SOMMELIER_MASCOT} alt="" fill sizes="64px" className="object-contain p-1.5" />
      </span>
    </button>
  );
}
