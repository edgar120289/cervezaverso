import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/**" }]
      : [],
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
