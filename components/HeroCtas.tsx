import Link from "next/link";
import type { HeroCta } from "@/lib/hero";

const base =
  "inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-semibold transition-transform active:scale-[0.98]";
const primary = `${base} bg-accent text-white shadow-accent hover:brightness-110`;
const secondary = `${base} border-2 border-white/85 text-white hover:bg-white hover:text-black`;

/** De 0 a 3 botones del Hero: el 1.º sólido, el 2.º y el 3.º de contorno. Los externos abren en pestaña nueva. */
export default function HeroCtas({ ctas }: { ctas: HeroCta[] }) {
  if (ctas.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6">
      {ctas.map((cta, index) => {
        const className = index === 0 ? primary : secondary;
        return cta.is_external ? (
          <a key={`${cta.text}-${index}`} href={cta.url} target="_blank" rel="noopener noreferrer" className={className}>
            {cta.text}
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        ) : (
          <Link key={`${cta.text}-${index}`} href={cta.url} className={className}>
            {cta.text}
          </Link>
        );
      })}
    </div>
  );
}
