/** Dato del negocio que falta: visible a propósito hasta que se capture (regla del proyecto). */
export default function Pending({ children }: { children: string }) {
  return (
    <mark className="rounded-md bg-accent-wash/50 px-1 font-semibold text-ink">[[PENDIENTE: {children}]]</mark>
  );
}
