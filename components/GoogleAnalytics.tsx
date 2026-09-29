"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT, readConsent, type CookieConsent } from "@/lib/consent";

const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_ID;
/** Sólo IDs con formato de GA4: el valor se inserta en un script en línea. */
const GA_ID = RAW_GA_ID && /^G-[A-Z0-9]+$/.test(RAW_GA_ID) ? RAW_GA_ID : undefined;

/** Detiene GA y borra sus cookies (`_ga`, `_ga_*`) cuando se revoca el consentimiento. */
function disableAnalytics(gaId: string) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
  const domain = window.location.hostname.replace(/^www\./, "");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
    }
  }
}

/**
 * Google Analytics 4. No se carga mientras falte `NEXT_PUBLIC_GA_ID` o el
 * visitante no acepte la analítica; si después la rechaza, se desactiva.
 */
export default function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasConsent(readConsent() === "all");
    const onChange = (event: Event) => {
      const granted = (event as CustomEvent<CookieConsent>).detail === "all";
      if (GA_ID) {
        if (granted) delete (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`];
        else disableAnalytics(GA_ID);
      }
      setHasConsent(granted);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!GA_ID || !hasConsent) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
