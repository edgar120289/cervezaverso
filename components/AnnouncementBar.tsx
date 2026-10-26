import Link from "next/link";

/** Barra superior global: enlaza a /envios con una versión corta en celular. */
export default function AnnouncementBar() {
  return (
    <Link
      href="/envios"
      className="flex min-h-11 items-center justify-center bg-ink px-4 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-black/85 sm:text-sm"
    >
      <span className="sm:hidden">Envío gratis en CDMX desde $1,000</span>
      <span className="hidden sm:inline">
        Envío gratis en CDMX y zona metropolitana desde $1,000 · Entrega en 24 a 48 h
      </span>
    </Link>
  );
}
