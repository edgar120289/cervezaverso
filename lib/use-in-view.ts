"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** ¿Está el elemento dentro del viewport? Para pausar lo que no se ve (timers, animaciones). */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}
