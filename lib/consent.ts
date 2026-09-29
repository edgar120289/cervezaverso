/** Consentimiento de cookies (MASTER PROMPT V2 · Bloque 4.2). Sólo cliente. */
export type CookieConsent = "all" | "essential";

const STORAGE_KEY = "cervezaverso:cookie-consent";
export const CONSENT_EVENT = "cervezaverso:consent-change";

export function readConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "all" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Sin localStorage el banner volverá a aparecer en la próxima visita.
  }
  window.dispatchEvent(new CustomEvent<CookieConsent>(CONSENT_EVENT, { detail: consent }));
}
