"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import MultiverseLogo from "./MultiverseLogo";
import { readConsent, saveConsent } from "@/lib/consent";

const STORAGE_KEY = "cervezaverso:age-gate-accepted";
/** Páginas legales que el modal enlaza: ahí no se tapan, para poder leerlas antes de aceptar. */
const LEGAL_PATHS = ["/privacidad", "/terminos"];

type AgeGateModalProps = {
  logoImages: string[];
  logoFrame: string;
};

function readAgeAccepted(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

/**
 * Bienvenida: una sola pantalla y un solo clic para confirmar la mayoría de
 * edad y aceptar cookies. Sólo aparece si falta alguna de las dos respuestas.
 */
export default function AgeGateModal({ logoImages, logoFrame }: AgeGateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const pathname = usePathname();
  const isVisible = isOpen && !LEGAL_PATHS.includes(pathname);

  useEffect(() => {
    // Se decide en el cliente, tras montar, para evitar mismatch de hidratación
    // (el servidor no conoce localStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(!readAgeAccepted() || !readConsent());
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isVisible]);

  function handleAccept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Si localStorage falla, igual dejamos pasar en esta sesión.
    }
    saveConsent("all");
    setIsOpen(false);
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-gate-title"
          aria-describedby="age-gate-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f2f4f5]/40 p-4 backdrop-blur-xl backdrop-saturate-150"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col items-center gap-5 overflow-y-auto rounded-[28px] bg-white p-8 text-center shadow-card ring-1 ring-black/5"
          >
            <MultiverseLogo images={logoImages} frame={logoFrame} size={180} autoCycleMs={1800} priority />

            <AnimatePresence mode="wait" initial={false}>
              {isMinor ? (
                <motion.div
                  key="minor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-full flex-col items-center gap-4"
                >
                  <h2 id="age-gate-title" className="text-xl font-semibold tracking-[-0.03em]">
                    Te esperamos pronto
                  </h2>
                  <p id="age-gate-description" className="text-sm leading-relaxed text-black/50">
                    La venta de bebidas alcohólicas es exclusiva para mayores de 18 años. El multiverso seguirá
                    aquí cuando llegue tu momento.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMinor(false)}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-black/50 transition-colors hover:bg-black/5 hover:text-black"
                  >
                    Me equivoqué, volver
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="gate"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-full flex-col items-center gap-5"
                >
                  <h2 id="age-gate-title" className="sr-only">
                    Bienvenida a Cervezaverso
                  </h2>
                  <p
                    id="age-gate-description"
                    className="text-[15px] leading-relaxed tracking-[-0.01em] text-black/60"
                  >
                    <span className="font-semibold text-black">El multiverso de la cerveza te espera.</span> Al
                    confirmar que eres mayor de edad (+18) y aceptar el uso de cookies para mejorar tu
                    experiencia, iniciamos el viaje.
                  </p>
                  <div className="flex w-full flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleAccept}
                      autoFocus
                      className="w-full rounded-full bg-[#5433eb] px-6 py-3.5 font-semibold text-white shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
                    >
                      Sí, tengo +18 y acepto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMinor(true)}
                      className="w-full rounded-full px-6 py-3 text-sm font-semibold text-black/45 transition-colors hover:bg-black/5 hover:text-black"
                    >
                      Soy menor
                    </button>
                  </div>
                  <p className="text-[11px] text-black/35">
                    <Link href="/privacidad" className="underline-offset-2 hover:text-black/60 hover:underline">
                      Privacidad
                    </Link>
                    {" · "}
                    <Link href="/terminos" className="underline-offset-2 hover:text-black/60 hover:underline">
                      Términos
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
