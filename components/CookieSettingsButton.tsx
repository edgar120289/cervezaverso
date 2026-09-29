"use client";

import { openCookieSettings } from "@/lib/consent";

/** Enlace del footer para revisar o revocar el consentimiento de cookies en cualquier momento. */
export default function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Configurar cookies
    </button>
  );
}
