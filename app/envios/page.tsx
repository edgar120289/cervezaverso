import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CreditCard, Landmark, Store, Truck } from "lucide-react";
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
    title: "CDMX y zona metropolitana",
    body: (
      <>
        <p>
          Envío gratis en pedidos desde {formatMXN(FREE_SHIPPING_THRESHOLD_METRO)}. En pedidos menores, el envío cuesta{" "}
          {formatMXN(FLAT_SHIPPING_COST)}.
        </p>
        <p>Entrega en 24 a 48 horas.</p>
      </>
    ),
  },
  {
    icon: Truck,
    title: "Resto de la República",
    body: (
      <>
        <p>
          Envío gratis en pedidos desde {formatMXN(FREE_SHIPPING_THRESHOLD)}. En pedidos menores, el envío cuesta{" "}
          {formatMXN(FLAT_SHIPPING_COST)}.
        </p>
        <p>Entrega en 3 a 6 días hábiles por paquetería.</p>
      </>
    ),
  },
  {
    icon: CreditCard,
    title: "Mercado Pago",
    body: <p>Paga con tarjeta de crédito o débito, SPEI o efectivo en OXXO.</p>,
  },
  {
    icon: Landmark,
    title: "Transferencia bancaria",
    body: <p>Los datos para depositar aparecen al finalizar tu compra. Con este método procesamos tu pedido de forma prioritaria.</p>,
  },
  {
    icon: Store,
    title: "Venta solo en línea",
    body: <p>Somos una tienda 100% en línea: no hay atención al público ni recolección en tienda.</p>,
  },
  {
    icon: Clock,
    title: "Atención",
    body: (
      <p>
        Lunes a domingo, de 9:00 a 21:00, por WhatsApp al{" "}
        <a href={CONTACT.whatsappUrl} className={linkClass}>
          {CONTACT.whatsappLabel}
        </a>{" "}
        o en{" "}
        <a href={`mailto:${CONTACT.email}`} className={linkClass}>
          {CONTACT.email}
        </a>
        . Facturación: {LEGAL.emailFacturas}.
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
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Cuánto cuesta el envío, cuándo llega tu pedido y cómo puedes pagarlo. Más detalle en nuestros{" "}
          <Link href="/terminos#envios" className={linkClass}>
            Términos y condiciones
          </Link>
          .
        </p>
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
