/** Cómo funciona el programa de premios (texto informativo; la lógica vive en lib/lealtad). */
export default function RewardsInfo() {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-card">
      <h3 className="font-semibold tracking-tight">Programa de premios</h3>
      <p className="mt-1 text-sm text-muted">Cada botella que compras suma. Así funciona:</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-black/70 marker:font-semibold marker:text-accent">
        <li>
          Cuando procesamos tu pedido y se confirma tu pago, sumamos a tu avance las botellas que compraste.
        </li>
        <li>
          Cada 20 botellas desbloqueas un cupón con un beneficio distinto, como una pieza de cristalería o 10% de
          descuento en tu siguiente pedido.
        </li>
        <li>Al llegar a 60 botellas se desbloquean nuevos niveles con más beneficios.</li>
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Consulta tu avance y tus cupones en Mi cuenta. Los cupones no se acumulan con el 10% por compras mayores a
        $6,000 ni con otras promociones.
      </p>
    </div>
  );
}
