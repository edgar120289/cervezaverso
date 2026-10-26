import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CreditCard, FileText, IdCard, Percent, Truck, Undo2 } from "lucide-react";
import { formatMXN, FLAT_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_METRO } from "@/lib/pricing";
import { CONTACT, LEGAL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Envíos y pagos",
  description:
    "Envío gratis en CDMX y zona metropolitana desde $1,000 con entrega en 24 a 48 horas. Resto del país en 3 a 6 días hábiles. Paga con tarjeta, SPEI, OXXO o transferencia.",
  alternates: { canonical: "/envios" },
};

const linkClass = "font-semibold text-accent hover:underline";

const SECTIONS = [
  {
    icon: Truck,
    title: "Envíos",
    body: (
      <>
        <p>
          <strong className="text-ink">CDMX y zona metropolitana:</strong> gratis desde{" "}
          {formatMXN(FREE_SHIPPING_THRESHOLD_METRO)}; {formatMXN(FLAT_SHIPPING_COST)} en pedidos menores. Tiempo de
          entrega: 24 a 48 horas.
        </p>
        <p>
          <strong className="text-ink">Resto de la República:</strong> gratis desde {formatMXN(FREE_SHIPPING_THRESHOLD)};{" "}
          {formatMXN(FLAT_SHIPPING_COST)} en pedidos menores. Tiempo de entrega: 3 a 6 días hábiles, por paquetería.
        </p>
        <p>
          Procesamos los pedidos en un máximo de 24 horas; si pagas por transferencia, el proceso es más rápido. No
          tenemos tienda física ni recolección en el local: todos los pedidos se entregan a domicilio.
        </p>
      </>
    ),
  },
  {
    icon: Percent,
    title: "Descuento por volumen",
    body: (
      <p>
        En compras mayores a $6,000 en productos te descontamos 10% automáticamente en el carrito. No es acumulable con
        códigos, cupones del programa de premios ni otras promociones.
      </p>
    ),
  },
  {
    icon: CreditCard,
    title: "Formas de pago",
    body: (
      <p>
        Mercado Pago (tarjeta de crédito o débito, SPEI y efectivo en OXXO) o transferencia bancaria. Los pagos en
        línea se procesan en la página segura de Mercado Pago: nunca vemos ni guardamos los datos de tu tarjeta.
      </p>
    ),
  },
  {
    icon: FileText,
    title: "Facturación",
    body: (
      <p>
        Solicita tu factura dentro del mismo mes de tu compra a{" "}
        <a href={`mailto:${LEGAL.emailFacturas}`} className={linkClass}>
          {LEGAL.emailFacturas}
        </a>
        .
      </p>
    ),
  },
  {
    icon: IdCard,
    title: "Venta solo a mayores de 18 años",
    body: <p>Al recibir tu pedido te pediremos una identificación oficial.</p>,
  },
  {
    icon: Undo2,
    title: "Cambios y devoluciones",
    body: (
      <p>
        Consulta la sección 07 de los{" "}
        <Link href="/terminos#devoluciones" className={linkClass}>
          Términos y condiciones
        </Link>
        .
      </p>
    ),
  },
  {
    icon: Clock,
    title: "¿Dudas?",
    body: (
      <p>
        WhatsApp{" "}
        <a href={CONTACT.whatsappUrl} className={linkClass}>
          {CONTACT.whatsappLabel}
        </a>{" "}
        ·{" "}
        <a href={`mailto:${CONTACT.email}`} className={linkClass}>
          {CONTACT.email}
        </a>{" "}
        · Lunes a domingo, de 9:00 a 21:00.
      </p>
    ),
  },
];

export default function EnviosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6">
      <header className="rounded-[28px] bg-white px-6 py-10 shadow-card sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Ayuda</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
          Envíos y pagos
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex gap-4 rounded-[28px] bg-white p-6 shadow-card">
            <Icon size={20} className="mt-0.5 shrink-0 text-muted" />
            <div>
              <h2 className="font-semibold tracking-tight">{title}</h2>
              <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted">{body}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
