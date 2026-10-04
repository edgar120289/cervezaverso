import Image from "next/image";
import Link from "next/link";
import { SOMMELIER_MASCOT, SOMMELIER_NAME } from "@/lib/site";

/** Banner promocional del Sommelier: lleva a la tienda con el chat abierto (`?chat=open`). */
export default function SommelierIntro() {
  return (
    <section
      aria-labelledby="sommelier-intro"
      className="grid items-center gap-8 rounded-[28px] bg-white p-8 shadow-card sm:grid-cols-[auto_1fr] sm:gap-14 sm:p-12"
    >
      <div className="relative mx-auto h-40 w-40 sm:h-52 sm:w-52">
        <Image src={SOMMELIER_MASCOT} alt="" fill sizes="208px" className="object-contain" />
      </div>
      <div className="text-center sm:text-left">
        <h2 id="sommelier-intro" className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          ¡Hola! Soy {SOMMELIER_NAME}.
        </h2>
        <p className="mt-3 text-lg font-semibold text-accent sm:text-xl">Tu Sommelier experta en cerveza artesanal.</p>
        <p className="mt-3 max-w-xl text-base text-muted">
          Encuentra el maridaje perfecto para tu comida o descubre tu próximo estilo favorito en segundos.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
