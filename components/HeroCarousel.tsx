"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { HeroBanner } from "@/lib/hero";
import { useInView } from "@/lib/use-in-view";
import HeroCtas from "./HeroCtas";
import HeroHeading from "./HeroHeading";

type HeroCarouselProps = {
  banners: HeroBanner[];
  intervalSeconds: number;
};

/**
 * Carrusel de banners con los botones de la diapositiva activa. Rota solo si se ve en pantalla,
 * sin "reducir movimiento" y sin que el visitante lo haya pausado (botón, o ratón/foco encima).
 */
export default function HeroCarousel({ banners, intervalSeconds }: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [sectionRef, inView] = useInView<HTMLElement>();
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  const hasMany = banners.length > 1;
  const isRotating = hasMany && inView && !userPaused && !hovering && !reduceMotion;

  useEffect(() => {
    if (!isRotating) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % banners.length), intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [isRotating, banners.length, intervalSeconds, index]);

  const active = banners[index] ?? banners[0];

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrusel"
      aria-label="Bienvenida"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="relative isolate flex min-h-[420px] flex-col items-center justify-center gap-8 overflow-hidden rounded-[28px] bg-neutral-900 py-12 shadow-card md:min-h-[560px]"
    >
      {banners.map((banner, i) => (
        <Image
          key={`${i}-${banner.image_url}`}
          src={banner.image_url}
          alt={banner.alt}
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          priority={i === 0}
          aria-hidden={i !== index}
          className={`z-0 object-cover transition-opacity duration-700 motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div aria-hidden className="absolute inset-0 z-0 bg-black/45" />
      <div aria-hidden className="absolute inset-0 z-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      {/* Un solo slide de texto montado a la vez: el anterior sale antes de que entre el siguiente. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${index}-${active.image_url}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          <HeroHeading title={active.title} subtitle={active.subtitle} />
          <HeroCtas ctas={active.ctas} />
        </motion.div>
      </AnimatePresence>

      {hasMany && (
        <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setUserPaused((paused) => !paused)}
            aria-label={userPaused ? "Reanudar el carrusel" : "Pausar el carrusel"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 hover:bg-white/15"
          >
            {userPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          {banners.map((banner, i) => (
            <button
              key={`${i}-${banner.image_url}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al banner ${i + 1}`}
              aria-current={i === index}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
