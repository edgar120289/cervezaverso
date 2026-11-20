"use client";

import { useEffect, useRef, useState } from "react";
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
export default function HeroCarousel({
  banners,
  intervalSeconds,
  products,
}: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [sectionRef, inView] = useInView<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Imágenes de los demás banners ya descargadas y decodificadas: solo se rota hacia una lista.
  const readyRef = useRef(new Set<string>());

  const hasMany = banners.length > 1;
  const isRotating =
    hasMany && inView && !userPaused && !hovering && !reduceMotion;

  // Tras cargar la página (sin competir con el primer banner) se descargan las demás imágenes.
  useEffect(() => {
    if (!hasMany) return;
    const ready = readyRef.current;
    const warm = () => {
      for (const banner of banners.slice(1)) {
        if (!banner.image_url || ready.has(banner.image_url)) continue;
        const img = new window.Image();
        img.src = banner.image_url;
        img
          .decode()
          .then(() => ready.add(banner.image_url as string))
          .catch(() => undefined);
      }
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => window.removeEventListener("load", warm);
  }, [hasMany, banners]);

  useEffect(() => {
    if (!isRotating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % banners.length;
        const url = banners[next]?.image_url;
        // Si la siguiente imagen aún no está lista, se queda la actual: nunca un banner en blanco.
        return !url || readyRef.current.has(url) ? next : current;
      });
    }, intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [isRotating, banners, intervalSeconds, index]);

  const active = banners[index] ?? banners[0];
  const ref = spotlightRef(active.style);
  // Con tarjeta de cerveza destacada, en celular el banner necesita más alto para que quepa completa.
  const hasSpotlight = banners.some((banner) => {
    const key = spotlightRef(banner.style);
    return Boolean(key && products[key]);
  });

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
      className="w-full"
    >
      <div
        className={`relative w-full overflow-hidden rounded-[28px] md:aspect-[21/9] ${hasSpotlight ? "aspect-[3/5]" : "aspect-[4/5]"}`}
      >
        {/* Fundido cruzado: el nuevo entra encima y el anterior se retira cuando ya lo cubre,
            así nunca queda el área vacía entre banners. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={`${index}-${active.image_url}`}
            // `initial={false}` en AnimatePresence: el primero llega visible desde el servidor, sin animación de entrada.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, zIndex: 1 }}
            exit={{
              opacity: 0,
              zIndex: 0,
              transition: { delay: reduceMotion ? 0 : 0.35, duration: 0 },
            }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
            className="absolute inset-0"
          >
            <StyledBanner
              headingTag="div"
              title={active.title}
              subtitle={active.subtitle}
              ctas={active.ctas}
              style={active.style}
              imageUrl={active.image_url}
              imageAlt={active.alt}
              product={ref ? (products[ref] ?? null) : null}
              priority={index === 0}
              fill
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles debajo del banner, nunca encima: no tapan el botón de compra ni los textos. */}
      {hasMany && (
        <div className="mt-1 flex justify-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUserPaused((paused) => !paused)}
              aria-label={
                userPaused ? "Reanudar el carrusel" : "Pausar el carrusel"
              }
              className="flex h-11 w-11 items-center justify-center rounded-full text-black/60 hover:bg-black/5"
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
                <span
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-2 bg-black/20"}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
