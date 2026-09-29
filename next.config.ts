import type { NextConfig } from "next";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : undefined;
const supabaseHostname = supabaseOrigin ? new URL(supabaseOrigin).hostname : undefined;

const isDev = process.env.NODE_ENV === "development";

const TURNSTILE = "https://challenges.cloudflare.com";
const GA_SCRIPT = "https://www.googletagmanager.com";
const GA_COLLECT = "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com";

/**
 * CSP sin nonce: un nonce obligaría a renderizar cada página en cada visita
 * (sin HTML estático ni caché de CDN). Por eso `script-src` conserva
 * 'unsafe-inline' (scripts de hidratación de Next y el arranque de GA), pero
 * limita los orígenes a los propios, Turnstile y Google Analytics, y bloquea
 * `object`, `base`, iframes ajenos y que otro sitio nos incruste.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${TURNSTILE} ${GA_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${GA_SCRIPT} https://*.google-analytics.com`,
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self' ${supabaseOrigin ?? ""} ${GA_COLLECT}`,
  `frame-src ${TURNSTILE}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/**" }]
      : [],
  },
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Rutas legales anteriores → nuevas (308 permanente: conserva enlaces y SEO).
  redirects() {
    return [
      { source: "/politica-de-privacidad", destination: "/privacidad", permanent: true },
      { source: "/terminos-y-condiciones", destination: "/terminos", permanent: true },
    ];
  },
};

export default nextConfig;
