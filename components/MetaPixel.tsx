"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, readConsent, type CookieConsent } from "@/lib/consent";

const PIXEL_ID = "2955206804839288";

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Meta Pixel. Es marketing: no se carga hasta que el visitante acepta todas las cookies
 * y, si después las rechaza, deja de registrar. Sin `<noscript>`: sin JavaScript no hay
 * forma de pedir el consentimiento, así que el pixel de imagen no puede cargarse.
 */
export default function MetaPixel() {
  const [hasConsent, setHasConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasConsent(readConsent() === "all");
    const onChange = (event: Event) => {
      const granted = (event as CustomEvent<CookieConsent>).detail === "all";
      window.fbq?.("consent", granted ? "grant" : "revoke");
      setHasConsent(granted);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (hasConsent && ready) window.fbq?.("track", "PageView");
  }, [hasConsent, ready, pathname, search]);

  if (!hasConsent) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive" onReady={() => setReady(true)}>
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');`}
    </Script>
  );
}
