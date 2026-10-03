import Image from "next/image";
import Link from "next/link";
import { SOMMELIER_MASCOT } from "@/lib/site";

/** Presentación estática del Sommelier: el chat flotante solo aparece en la tienda, así que aquí se invita a ir. */
export default function SommelierIntro() {
  return (
    <section
      aria-labelledby="sommelier-intro"
      className="grid items-center gap-6 rounded-[28px] bg-white p-6 shadow-card sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10"
    >
      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-canvas sm:h-36 sm:w-36">
        <Image src={SOMMELIER_MASCOT} alt="" fill sizes="144px" className="object-contain p-3" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Sommelier con IA</p>
        <h2 id="sommelier-intro" className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          ¿No sabes cuál elegir? Pregúntale a nuestro Sommelier.
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Es un Sommelier impulsado por inteligencia artificial: te hace unas preguntas sobre tus gustos y te
          recomienda cervezas del catálogo. Lo encuentras en la tienda, en el botón flotante.
        </p>
        <Link
          href="/tienda"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-canvas px-6 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
        >
          Ir a la tienda y hablar con él
        </Link>
      </div>
    </section>
  );
}
