import { Globe } from "lucide-react";
import { countryFlagUrl } from "@/lib/country-flags";

/** Bandera local (PNG de /public/flags) (los emojis de bandera no existen en Windows). Sin país reconocido, un globo. */
export default function CountryFlag({ country }: { country: string }) {
  const url = countryFlagUrl(country);

  if (!url) return <Globe size={16} aria-hidden className="shrink-0 text-muted" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- PNG de 40 px ya optimizado y servido desde /public.
    <img
      src={url}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className="h-[15px] w-5 shrink-0 rounded-[3px] object-cover ring-1 ring-black/10"
    />
  );
}
