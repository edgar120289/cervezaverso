"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

type TurnstileOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** ¿Hay que esperar el token antes de enviar? Sin clave (desarrollo local) no se muestra el widget. */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

/**
 * Widget de Cloudflare Turnstile (render explícito). Entrega el token por
 * `onToken` y `null` cuando expira o falla. Cambiar `resetKey` pide un token
 * nuevo: cada token sólo se puede validar una vez en el servidor.
 */
export default function Turnstile({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
      size: "flexible",
      appearance: "interaction-only",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }, []);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0 || !widgetIdRef.current) return;
    onTokenRef.current(null);
    window.turnstile?.reset(widgetIdRef.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-0 w-full" />
    </>
  );
}
