"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ROTATE_MS = 5000;
const BAR_CLASS =
  "flex min-h-11 items-center justify-center bg-ink px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm";

/**
 * En pantallas grandes caben todos los mensajes en una línea; en celular rotan uno por uno (se pausa al tocar o enfocar).
 * `homeOnly`: solo se muestra en la portada. `preview` la pinta siempre (vista previa del admin).
 */
export default function AnnouncementBarView({
  messages,
  href,
  homeOnly = false,
  preview = false,
}: {
  messages: string[];
  href: string;
  homeOnly?: boolean;
  preview?: boolean;
}) {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = messages.length;

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0 || (!preview && homeOnly && pathname !== "/")) return null;

  const content = (
    <>
      <span className={preview ? "" : "lg:hidden"}>{messages[index % count]}</span>
      {!preview && <span className="hidden lg:inline">{messages.join(" · ")}</span>}
    </>
  );
  const pause = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  if (!href || preview) {
    return (
      <div className={BAR_CLASS} {...pause}>
        {content}
      </div>
    );
  }
  return (
    <Link href={href} className={`${BAR_CLASS} transition-colors hover:bg-black/85`} {...pause}>
      {content}
    </Link>
  );
}
