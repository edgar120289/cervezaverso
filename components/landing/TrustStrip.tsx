import { Beer, Gift, Truck, type LucideIcon } from "lucide-react";
import { getCatalogStats } from "@/lib/catalog";
import { formatMXN, freeShippingThreshold } from "@/lib/pricing";

type Fact = { icon: LucideIcon; title: string; detail: string };

/** Franja de 3 datos bajo el Hero. Cifras y umbrales salen del catálogo y de `lib/pricing.ts`, nunca a mano. */
export default async function TrustStrip() {
  const { beers, countries } = await getCatalogStats();
  const facts: Fact[] = [
    ...(beers > 0
      ? [{ icon: Beer, title: `${beers} cervezas de ${countries} países`, detail: "Artesanales e importadas" }]
      : []),
    { icon: Truck, title: "Entrega en 24–48 h en CDMX", detail: "y zona metropolitana" },
    {
      icon: Gift,
      title: `Envío gratis desde ${formatMXN(freeShippingThreshold("metro"))}`,
      detail: `En CDMX y zona metropolitana · ${formatMXN(freeShippingThreshold("nacional"))} en el resto del país`,
    },
  ];

  return (
    <section aria-label="Por qué comprar en Cervezaverso" className="rounded-[28px] bg-white shadow-card">
      <ul className="scrollbar-none flex snap-x gap-2 overflow-x-auto px-4 py-2.5 md:grid md:grid-cols-3 md:gap-0 md:divide-x md:divide-black/5 md:px-0 md:py-4">
        {facts.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex shrink-0 snap-start items-center gap-3 pr-4 md:px-6 md:pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-sm font-semibold tracking-[-0.02em] md:whitespace-normal">
                {title}
              </span>
              <span className="block whitespace-nowrap text-xs text-muted md:whitespace-normal">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
