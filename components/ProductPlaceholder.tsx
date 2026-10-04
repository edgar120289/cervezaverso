import { Beer } from "lucide-react";

/** Respaldo de una cerveza sin foto (o cuya foto falla): fondo gris claro con un tarro en gris oscuro. */
export default function ProductPlaceholder({ iconClassName = "h-2/5 w-2/5" }: { iconClassName?: string }) {
  return (
    <div role="img" aria-label="Sin imagen disponible" className="flex h-full w-full items-center justify-center bg-neutral-200 text-neutral-600">
      <Beer aria-hidden strokeWidth={1.5} className={iconClassName} />
    </div>
  );
}
