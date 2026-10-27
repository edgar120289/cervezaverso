"use client";

import { useEffect } from "react";
import Script from "next/script";
import { CONSENT_EVENT, CONSENT_KEY, type CookieConsent } from "@/lib/consent";
import { ADS_ID, GA_ID } from "@/lib/google-tag";

const STORAGE_TYPES = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"] as const;

function consentState(value: "granted" | "denied") {
  return Object.fromEntries(STORAGE_TYPES.map((type) => [type, value]));
}

/** Borra las cookies de Google (`_ga*`, `_gcl_*`, `_gac_*`) cuando se revoca el consentimiento. */
function clearGoogleCookies() {
  const domain = window.location.hostname.replace(/^www\./, "");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name === "_ga" || /^(_ga_|_gcl_|_gac_)/.test(name)) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
    }
  }
}

/**
 * Etiqueta de Google (gtag.js) con GA4 y Google Ads, cargada una sola vez para todo el sitio. Usa el
 * Modo de consentimiento v2: los cuatro permisos arrancan en `denied` y pasan a `granted` solo si el
 * visitante aceptó todas las cookies («Solo esenciales» los deja denegados). Sin IDs configurados no
 * renderiza nada. El arranque va en `beforeInteractive` para que `gtag` y el consentimiento existan antes de
 * que los eventos de React (`view_item`, `add_to_cart`) se disparen.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    const onChange = (event: Event) => {
      const granted = (event as CustomEvent<CookieConsent>).detail === "all";
      window.gtag?.("consent", "update", consentState(granted ? "granted" : "denied"));
      if (!granted) clearGoogleCookies();
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  const primaryId = GA_ID ?? ADS_ID;
  if (!primaryId) return null;

  const configs = [GA_ID, ADS_ID].filter(Boolean).map((id) => `gtag('config','${id}');`);

  return (
    <>
      {/* App Router admite beforeInteractive en componentes del layout raíz; la regla es de pages/_document. */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script id="google-tag" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',${JSON.stringify({ ...consentState("denied"), wait_for_update: 500 })});
gtag('set','ads_data_redaction',true);
try{if(localStorage.getItem(${JSON.stringify(CONSENT_KEY)})==='all')gtag('consent','update',${JSON.stringify(consentState("granted"))});}catch(e){}
gtag('js',new Date());
${configs.join("\n")}`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`} strategy="afterInteractive" />
    </>
  );
}
