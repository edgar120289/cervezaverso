import type { HeroCta } from "@/lib/hero";
import CtaLink from "./CtaLink";

export const CTA_BASE =
  "inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-semibold transition-transform active:scale-[0.98]";
export const CTA_PRIMARY = `${CTA_BASE} bg-accent text-white shadow-accent hover:brightness-110`;
export const CTA_SECONDARY = `${CTA_BASE} border-2 border-white/85 text-white hover:bg-white hover:text-black`;

/** De 0 a 3 botones del Hero: el 1.º sólido, el 2.º y el 3.º de contorno. */
export default function HeroCtas({ ctas }: { ctas: HeroCta[] }) {
  if (ctas.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6">
      {ctas.map((cta, index) => (
        <CtaLink key={`${cta.text}-${index}`} cta={cta} className={index === 0 ? CTA_PRIMARY : CTA_SECONDARY} />
      ))}
    </div>
  );
}
