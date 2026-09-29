/** Mayoría de edad y consentimiento de cookies. Sólo cliente. */
export type CookieConsent = "all" | "essential";

const CONSENT_KEY = "cervezaverso:cookie-consent";
const AGE_KEY = "cervezaverso:age-gate-accepted";
/** En sessionStorage: "Soy menor" bloquea el sitio hasta cerrar el navegador. */
const MINOR_KEY = "cervezaverso:minor-blocked";

export const CONSENT_EVENT = "cervezaverso:consent-change";
/** Pide al modal que abra la configuración de cookies (enlace del footer). */
export const OPEN_COOKIE_SETTINGS_EVENT = "cervezaverso:open-cookie-settings";

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Sin almacenamiento el modal volverá a aparecer en la próxima visita.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function readConsent(): CookieConsent | null {
  const value = read(local, CONSENT_KEY);
  return value === "all" || value === "essential" ? value : null;
}

export function saveConsent(consent: CookieConsent) {
  write(local, CONSENT_KEY, consent);
  window.dispatchEvent(new CustomEvent<CookieConsent>(CONSENT_EVENT, { detail: consent }));
}

export function readAgeAccepted(): boolean {
  return read(local, AGE_KEY) === "true";
}

/** Confirma +18 y guarda la elección de cookies en un solo paso. */
export function acceptAgeWithConsent(consent: CookieConsent) {
  write(local, AGE_KEY, "true");
  saveConsent(consent);
}

export function readMinorBlocked(): boolean {
  return read(session, MINOR_KEY) === "true";
}

export function blockMinorForSession() {
  write(session, MINOR_KEY, "true");
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
