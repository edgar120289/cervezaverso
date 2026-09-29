import Link from "next/link";
import BottleFallback from "@/components/BottleFallback";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex flex-col items-center gap-5 rounded-[28px] bg-white px-6 py-16 text-center shadow-card sm:py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-canvas text-muted">
          <BottleFallback className="h-12 w-12" />
        </div>
        <p className="text-sm font-semibold tracking-[-0.01em] text-muted">Error 404</p>
        <h1 className="max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
          Esta página se quedó sin cerveza.
        </h1>
        <p className="max-w-sm text-muted">
          La dirección no existe o la cerveza que buscabas ya no está en el catálogo.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
