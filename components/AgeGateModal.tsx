"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import MultiverseLogo from "./MultiverseLogo";
import {
  acceptAgeWithConsent,
  blockMinorForSession,
  OPEN_COOKIE_SETTINGS_EVENT,
  readAgeAccepted,
  readConsent,
  readMinorBlocked,
  saveConsent,
  type CookieConsent,
} from "@/lib/consent";

/** Páginas legales que el modal enlaza: ahí no se tapan, para poder leerlas antes de aceptar. */
const LEGAL_PATHS = ["/privacidad", "/terminos"];

type View = "gate" | "settings" | "minor";

type AgeGateModalProps = {
  logoImages: string[];
  logoFrame: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bienvenida de cumplimiento: confirma la mayoría de edad y registra la
 * elección de cookies. El botón principal hace ambas cosas en un clic;
 * "Solo esenciales" y "Configurar cookies" permiten confirmar la edad sin
 * aceptar analítica (el consentimiento debe ser libre y específico).
 * "Soy menor" bloquea el sitio el resto de la sesión.
 */
export default function AgeGateModal({ logoImages, logoFrame }: AgeGateModalProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<View | null>(null);
  /** true cuando se abrió desde el footer sólo para cambiar cookies (la edad ya estaba confirmada). */
  const [settingsOnly, setSettingsOnly] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isVisible = view !== null && (view === "minor" || settingsOnly || !LEGAL_PATHS.includes(pathname));

  useEffect(() => {
    // Se decide en el cliente, tras montar: el servidor no conoce el almacenamiento del navegador.
    const initialView: View | null = readMinorBlocked()
      ? "minor"
      : !readAgeAccepted() || !readConsent()
        ? "gate"
        : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(initialView);

    function openSettings() {
      if (readMinorBlocked()) return;
      setAnalytics(readConsent() === "all");
      setSettingsOnly(readAgeAccepted());
      setView("settings");
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  // Bloquea el scroll de fondo y lleva el foco al diálogo.
  useEffect(() => {
    if (!isVisible) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const first = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? dialogRef.current;
    first?.focus();
  }, [isVisible, view]);

  function finish(consent: CookieConsent) {
    if (settingsOnly) saveConsent(consent);
    else acceptAgeWithConsent(consent);
    closeSettings();
  }

  function closeSettings() {
    setView(null);
    setSettingsOnly(false);
  }

  function handleMinor() {
    blockMinorForSession();
    setView("minor");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && settingsOnly) return closeSettings();
    if (e.key !== "Tab" || !dialogRef.current) return;
    // Trampa de foco: el teclado no sale del diálogo mientras está abierto.
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const fade = reduceMotion ? { duration: 0 } : { duration: 0.25 };
  const step = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: fade };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas/95 p-4"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            aria-describedby="age-gate-description"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col items-center gap-5 overflow-y-auto rounded-[28px] bg-white p-8 text-center shadow-card outline-none ring-1 ring-black/5"
          >
            <MultiverseLogo
              images={logoImages}
              frame={logoFrame}
              size={view === "settings" ? 96 : 140}
            />

            <AnimatePresence mode="wait" initial={false}>
              {view === "minor" && (
                <motion.div key="minor" {...step} className="flex w-full flex-col items-center gap-4">
                  <h2 id="age-gate-title" className="text-xl font-semibold tracking-[-0.03em]">
                    Te esperamos pronto
                  </h2>
                  <p id="age-gate-description" className="text-sm leading-relaxed text-muted">
                    La venta de bebidas alcohólicas es exclusiva para mayores de 18 años. El multiverso seguirá aquí
                    cuando llegue tu momento.
                  </p>
                </motion.div>
              )}

              {view === "gate" && (
                <motion.div key="gate" {...step} className="flex w-full flex-col items-center gap-5">
                  <h2 id="age-gate-title" className="sr-only">
                    Bienvenida a Cervezaverso
                  </h2>
                  <p id="age-gate-description" className="text-[15px] leading-relaxed tracking-[-0.01em] text-muted">
                    <span className="font-semibold text-ink">El multiverso de la cerveza te espera.</span> Confirma
                    que eres mayor de edad (+18). Con el botón principal también aceptas cookies de analítica para
                    mejorar la tienda.
                  </p>
                  <div className="flex w-full flex-col gap-1.5">
                    <button
                      type="button"
                      data-autofocus
                      onClick={() => finish("all")}
                      className="min-h-12 w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white shadow-accent transition-transform hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
                    >
                      Sí, tengo +18 y acepto
                    </button>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <SecondaryButton onClick={() => finish("essential")}>Solo esenciales</SecondaryButton>
                      <span aria-hidden className="text-muted">
                        ·
                      </span>
                      <SecondaryButton
                        onClick={() => {
                          setAnalytics(false);
                          setView("settings");
                        }}
                      >
                        Configurar cookies
                      </SecondaryButton>
                    </div>
                    <button
                      type="button"
                      onClick={handleMinor}
                      className="min-h-11 w-full rounded-full px-6 text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink"
                    >
                      Soy menor
                    </button>
                  </div>
                  <LegalLinks />
                </motion.div>
              )}

              {view === "settings" && (
                <motion.div key="settings" {...step} className="flex w-full flex-col gap-4 text-left">
                  <h2 id="age-gate-title" className="text-center text-xl font-semibold tracking-[-0.03em]">
                    Configurar cookies
                  </h2>
                  <p id="age-gate-description" className="text-sm leading-relaxed text-muted">
                    Elige qué cookies aceptas. Puedes cambiar tu elección cuando quieras desde el pie de página.
                  </p>

                  <div className="rounded-[20px] bg-canvas p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Esenciales</p>
                      <span className="text-xs font-semibold text-muted">Siempre activas</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Carrito, sesión, seguridad y esta misma elección. Sin ellas la tienda no funciona.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-[20px] bg-canvas p-4">
                    <span>
                      <span className="block text-sm font-semibold">Analítica</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        Google Analytics mide visitas de forma agregada para mejorar la tienda. Desactivada hasta que la
                        aceptes.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      data-autofocus
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-accent"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => finish(analytics ? "all" : "essential")}
                    className="min-h-12 w-full rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
                  >
                    {settingsOnly ? "Guardar preferencias" : "Tengo +18 y guardo mi elección"}
                  </button>
                  <button
                    type="button"
                    onClick={() => (settingsOnly ? closeSettings() : setView("gate"))}
                    className="min-h-11 w-full rounded-full text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink"
                  >
                    {settingsOnly ? "Cancelar" : "Volver"}
                  </button>
                  <LegalLinks />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full px-3 font-semibold text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
    >
      {children}
    </button>
  );
}

function LegalLinks() {
  return (
    <p className="text-center text-xs text-muted">
      <Link href="/privacidad" className="inline-flex min-h-11 items-center px-1 underline-offset-2 hover:text-ink hover:underline">
        Aviso de privacidad
      </Link>
      {" · "}
      <Link href="/terminos" className="inline-flex min-h-11 items-center px-1 underline-offset-2 hover:text-ink hover:underline">
        Términos
      </Link>
    </p>
  );
}
