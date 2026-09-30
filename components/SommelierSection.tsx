"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSommelier } from "./SommelierProvider";

export const SOMMELIER_MASCOT = "/img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo/14-kawaii-sonriente.png";

export default function SommelierSection() {
  const { openQuiz } = useSommelier();

  return (
    <section aria-labelledby="sommelier-cta">
      <div className="relative overflow-hidden rounded-[28px] bg-white shadow-card">
        <div aria-hidden className="absolute -left-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative grid items-center gap-2 px-6 py-8 sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-12 sm:py-10">
          <div className="relative mx-auto h-44 w-36 sm:h-56 sm:w-44">
            <Image
              src={SOMMELIER_MASCOT}
              alt="Tarrito kawaii sonriente, el sommelier de Cervezaverso"
              fill
              sizes="(min-width: 640px) 176px, 144px"
              className="object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.25)]"
            />
          </div>

          <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <span className="flex items-center gap-2 rounded-full bg-canvas px-4 py-1.5 text-xs font-semibold text-black/70">
              <Sparkles size={14} className="text-accent" />
              Sommelier Cervezaverso
            </span>
            <h2 id="sommelier-cta" className="max-w-lg text-balance text-2xl font-semibold tracking-[-0.04em] sm:text-4xl">
              ¿No sabes qué cerveza elegir? Yo te ayudo
            </h2>
            <p className="max-w-md text-muted">
              Tres preguntas rápidas y te recomiendo tres cervezas del catálogo para tu paladar y el momento.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={openQuiz}
              className="mt-1 min-h-12 rounded-full bg-accent px-7 font-semibold text-white shadow-accent transition hover:brightness-110"
            >
              Hacer el quiz de 3 preguntas
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
