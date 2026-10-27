import { CONTACT, SITE } from "@/lib/site";

/** Cadena segura para incrustar JSON-LD en un <script>. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\u003c");
}

/** Tienda en línea y sitio web de la portada. Sin dirección física: no hay atención al público. */
export function homeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: SITE.name,
      legalName: "Cervezaverso S.A.S. de C.V.",
      url: SITE.url,
      logo: `${SITE.url}/icons/icon-512.png`,
      description: "Tienda en línea de cerveza artesanal e importada, con envío a todo México.",
      email: CONTACT.email,
      telephone: "+52 56 4307 5041",
      areaServed: { "@type": "Country", name: "México" },
      sameAs: [CONTACT.instagramUrl, CONTACT.facebookUrl],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: "+52 56 4307 5041",
        email: CONTACT.email,
        availableLanguage: "es",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "09:00",
          closes: "21:00",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      inLanguage: "es-MX",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/tienda?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
