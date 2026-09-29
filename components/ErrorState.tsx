import Link from "next/link";
import BottleFallback from "./BottleFallback";

/** Contenido de las páginas de error (error.tsx y global-error.tsx). */
export default function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex flex-col items-center gap-5 rounded-[28px] bg-white px-6 py-16 text-center shadow-card sm:py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-canvas text-muted">
          <BottleFallback className="h-12 w-12" />
        </div>
        <p className="text-sm font-semibold tracking-[-0.01em] text-muted">Algo salió mal</p>
        <h1 className="max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
          Se nos derramó la cerveza.
        </h1>
        <p className="max-w-sm text-muted">
          Tuvimos un problema al cargar esta página. Intenta de nuevo; si sigue fallando, escríbenos por WhatsApp.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-12 rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-full px-6 font-semibold text-black/65 transition-colors hover:bg-black/5 hover:text-black"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
