import Image from "next/image";
import Link from "next/link";
import { SOMMELIER_MASCOT, SOMMELIER_NAME } from "@/lib/site";

/** Banner promocional del Sommelier: lleva a la tienda con el chat abierto (`?chat=open`). */
export default function SommelierIntro() {
  return (
    <section
      aria-labelledby="sommelier-intro"
      className="grid items-center gap-6 rounded-[28px] bg-white p-6 shadow-card sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10"
    >
      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-canvas ring-2 ring-accent sm:h-36 sm:w-36">
        <Image src={SOMMELIER_MASCOT} alt="" fill sizes="144px" className="object-contain p-3" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Sommelier con IA · {SOMMELIER_NAME}</p>
        <h2 id="sommelier-intro" className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          ¡Hola! Soy {SOMMELIER_NAME}, tu Sommelier personal. Cuéntame qué vas a comer o qué sabores te gustan, y te
          recomendaré la cerveza artesanal perfecta.
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tienda?chat=open"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-accent transition hover:brightness-110"
          >
            Ayúdame a elegir
          </Link>
          <Link
            href="/tienda?chat=open&mode=text"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-canvas px-6 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
          >
            Pregúntame lo que quieras
          </Link>
        </div>
      </div>
    </section>
  );
}
