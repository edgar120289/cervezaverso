"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MOBILE_MESSAGES = ["Envío gratis en CDMX desde $1,000", "10% en compras mayores a $6,000"];
const ROTATE_MS = 5000;

/** Barra superior global: enlaza a /envios. En celular rota entre mensajes cortos (se pausa al tocar o enfocar). */
export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % MOBILE_MESSAGES.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <Link
      href="/envios"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex min-h-11 items-center justify-center bg-ink px-4 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-black/85 sm:text-sm"
    >
      <span className="sm:hidden">{MOBILE_MESSAGES[index]}</span>
      <span className="hidden sm:inline">
        Envío gratis en CDMX y zona metropolitana desde $1,000 · Entrega en 24 a 48 h · 10% en compras mayores a $6,000
      </span>
    </Link>
  );
}
