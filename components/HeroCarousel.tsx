"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { HeroBanner } from "@/lib/hero";
import { spotlightRef } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import { useInView } from "@/lib/use-in-view";
import StyledBanner from "./landing/StyledBanner";

type HeroCarouselProps = {
  banners: HeroBanner[];
  intervalSeconds: number;
  products: Record<string, Product>;
};

/**
 * Carrusel de banners, cada uno con su propio estilo. Rota solo si se ve en pantalla,
 * sin "reducir movimiento" y sin que el visitante lo haya pausado (botón, o ratón/foco encima).
 */
export default function HeroCarousel({ banners, intervalSeconds, products }: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [sectionRef, inView] = useInView<HTMLDivElement>();
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
  const ref = spotlightRef(active.style);

  return (
    <div
      ref={sectionRef}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Bienvenida"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="relative"
    >
      {/* Un solo slide montado a la vez: el anterior sale antes de que entre el siguiente. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${index}-${active.image_url}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        >
          <StyledBanner
            headingTag="h1"
            title={active.title}
            subtitle={active.subtitle}
            ctas={active.ctas}
            style={active.style}
            imageUrl={active.image_url}
            imageAlt={active.alt}
            product={ref ? (products[ref] ?? null) : null}
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      {hasMany && (
        <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-1">
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
        </div>
      )}
    </div>
  );
}
