"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SHOW_AFTER_PX = 400;

/** Botón flotante "Volver arriba": aparece al bajar y vive sobre el Sommelier, en la esquina inferior derecha. */
export default function ScrollToTop() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
          aria-label="Volver arriba"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-44 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-card active:scale-95 sm:right-6"
        >
          <ArrowUp size={20} aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
