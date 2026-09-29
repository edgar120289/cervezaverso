"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSommelier } from "./SommelierProvider";

export default function SommelierSection() {
  const { openQuiz } = useSommelier();

  return (
    <section>
      <div className="relative overflow-hidden rounded-[28px] bg-black text-white shadow-card">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        >
          <source src="/video/sommelier-broll.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

        <div className="relative flex flex-col items-start gap-4 px-6 py-10 sm:max-w-md sm:px-10">
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            <Sparkles size={14} />
            Sommelier Cervezaverso
          </span>
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">
            ¿Qué cerveza elegir?
          </h2>
          <p className="text-white/70">
            Tres preguntas rápidas y te recomendamos tres cervezas del
            catálogo para tu paladar y el momento.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openQuiz}
            className="mt-2 rounded-full bg-[#5433eb] px-6 py-3.5 font-semibold text-white shadow-accent"
          >
            Hacer el quiz
          </motion.button>
        </div>
      </div>
    </section>
  );
}
