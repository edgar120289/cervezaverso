import { calculateShippingCost } from "@/lib/pricing";
import { METRO_POSTAL_RANGES } from "@/lib/shipping-zones";
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

const postalCode = (cp: number) => String(cp).padStart(5, "0");

const days = (minValue: number, maxValue: number) => ({
  "@type": "QuantitativeValue",
  minValue,
  maxValue,
  unitCode: "DAY",
});

/**
 * Envío de un producto: CDMX y zona metropolitana (24 a 48 h) y resto del país (3 a 6 días hábiles).
 * El costo sale de la regla vigente aplicada al precio del producto solo; el envío gratis por monto
 * de carrito depende de varias piezas y se configura en Merchant Center.
 */
export function shippingDetailsJsonLd(salePrice: number) {
  const rate = (zone: "metro" | "nacional") => ({
    "@type": "MonetaryAmount",
    value: calculateShippingCost(salePrice, zone).toFixed(2),
    currency: "MXN",
  });
  return [
    {
      "@type": "OfferShippingDetails",
      shippingRate: rate("metro"),
      shippingDestination: METRO_POSTAL_RANGES.map(([from, to]) => ({
        "@type": "DefinedRegion",
        addressCountry: "MX",
        postalCodeRange: { "@type": "PostalCodeRangeSpecification", postalCodeBegin: postalCode(from), postalCodeEnd: postalCode(to) },
      })),
      deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: days(0, 0), transitTime: days(1, 2) },
    },
    {
      "@type": "OfferShippingDetails",
      shippingRate: rate("nacional"),
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "MX" },
      deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: days(0, 0), transitTime: days(3, 6) },
    },
  ];
}
