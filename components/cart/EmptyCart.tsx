import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/** Carrito vacío: un solo botón, a la tienda. */
export default function EmptyCart({ onNavigate, headingLevel = "h2" }: { onNavigate?: () => void; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <ShoppingBag size={26} aria-hidden />
      </span>
      <Heading className="text-2xl font-semibold tracking-tight">Tu carrito está vacío</Heading>
      <p className="text-muted">Elige tus cervezas en la tienda para empezar.</p>
      <Link
        href="/tienda"
        onClick={onNavigate}
        className="mt-2 flex min-h-11 items-center rounded-full bg-accent px-7 font-semibold text-white shadow-accent"
      >
        Ir a la tienda
      </Link>
    </div>
  );
}
