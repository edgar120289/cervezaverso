"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { formatMXN, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { useSommelier } from "./SommelierProvider";

export type HeroSlide = { src: string; label: string };

const AUTOPLAY_MS = 4500;
const EASE = [0.16, 1, 0.3, 1] as const;

type HeroCinematicProps = {
  slides: HeroSlide[];
  /** B-roll de fondo; sin él (o si falla al cargar) se usa el degradado Canvas Mist. */
  videoSrc?: string;
};

export default function HeroCinematic({ slides, videoSrc }: HeroCinematicProps) {
  const { openQuiz } = useSommelier();
  const reduceMotion = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  // Con "reducir movimiento" no se reproduce video de fondo.
  const hasVideo = Boolean(videoSrc) && !videoFailed && !reduceMotion;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const count = slides.length;
  const goTo = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || isPaused || reduceMotion) return;
    const id = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, count, isPaused, reduceMotion, goTo]);

  const slide = slides[index];
  const dark = hasVideo;

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section
      aria-label="Bienvenida"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative isolate overflow-hidden rounded-[28px] shadow-card ${
        dark ? "bg-black text-white" : "bg-[#f2f4f5] text-black"
      }`}
    >
      {/* Fondo */}
      {hasVideo ? (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover"
            src={videoSrc}
          />
          {/* Capa cinematográfica: viñeta + degradado para legibilidad del texto. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f2f4f5] to-[#e7e4fb]" />
          <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#5433eb]/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-[360px] w-[360px] rounded-full bg-[#f5b942]/20 blur-3xl" />
        </div>
      )}

      <div className="grid items-center gap-6 px-6 pb-16 pt-12 sm:px-12 md:min-h-[600px] md:grid-cols-[1.25fr_1fr] md:py-16">
        <div className="flex flex-col items-start">
          <motion.p
            {...reveal(0)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur ${
              dark ? "bg-white/10 text-white/80" : "bg-white/70 text-black/60 shadow-card"
            }`}
          >
            Cervezaverso · Cerveza artesanal nacional e importada
          </motion.p>

          <motion.h1
            {...reveal(0.1)}
            className="mt-6 text-[2.9rem] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-[5.25rem]"
          >
            El placer
            <br />
            del{" "}
            <span
              className={`bg-clip-text italic text-transparent ${
                dark
                  ? "bg-gradient-to-r from-[#c9bcff] via-white to-[#f5d08a]"
                  : "bg-gradient-to-r from-[#5433eb] via-[#7b5cf5] to-[#c9892b]"
              }`}
            >
              deber cumplido.
            </span>
          </motion.h1>

          <motion.p
            {...reveal(0.2)}
            className={`mt-6 max-w-md text-lg leading-relaxed tracking-[-0.01em] ${dark ? "text-white/70" : "text-black/55"}`}
          >
            Cervezas de más de 20 países. Estilos, orígenes y maridajes seleccionados, con envío gratis desde{" "}
            {formatMXN(FREE_SHIPPING_THRESHOLD)}.
          </motion.p>

          <motion.div {...reveal(0.3)} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={openQuiz}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#5433eb] px-7 py-4 font-semibold text-white shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              {/* Brillo que recorre el botón */}
              {!reduceMotion && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-[shine_3.5s_ease-in-out_infinite]"
                />
              )}
              <Sparkles size={18} className="transition-transform group-hover:rotate-12" />
              Descubre tu Cerveza Ideal (Sommelier)
            </button>
            <Link
              href="#catalogo"
              className={`flex items-center justify-center rounded-full px-7 py-4 font-semibold transition-colors ${
                dark ? "bg-white/10 text-white backdrop-blur hover:bg-white/20" : "bg-white text-black shadow-card hover:bg-black hover:text-white"
              }`}
            >
              Explorar catálogo
            </Link>
          </motion.div>
        </div>

        {slide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            className="relative mx-auto aspect-square w-full max-w-[240px] md:max-w-[420px]"
          >
            <div
              aria-hidden
              className={`absolute inset-[12%] rounded-full blur-3xl ${dark ? "bg-[#5433eb]/40" : "bg-[#5433eb]/20"}`}
            />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={slide.src}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, rotate: 4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40, rotate: -4 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="absolute inset-0"
              >
                <Image
                  src={slide.src}
                  alt={`Tarro Cervezaverso edición ${slide.label}`}
                  fill
                  sizes="(min-width: 768px) 420px, 240px"
                  priority={index === 0}
                  className="object-contain drop-shadow-[0_28px_40px_rgba(0,0,0,0.45)]"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-1.5 sm:justify-end sm:px-12">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver tarro ${s.label}`}
              aria-current={i === index}
              className="flex h-6 items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? dark ? "w-5 bg-white" : "w-5 bg-black"
                    : dark ? "w-1.5 bg-white/30 hover:bg-white/60" : "w-1.5 bg-black/20 hover:bg-black/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
