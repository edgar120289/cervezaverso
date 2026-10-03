import type { Metadata } from "next";
import { Clock, MapPin } from "lucide-react";
import ContactChannels from "@/components/ContactChannels";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp, Instagram o Facebook. Te ayudamos a elegir tu cerveza y con tus pedidos.",
  alternates: { canonical: "/contacto" },
};

/** Datos editables: reemplaza los textos de relleno cuando estén definidos. */
const DETAILS = [
  { icon: Clock, title: "Horario de atención", body: "Lunes a sábado · horario por confirmar." },
  { icon: MapPin, title: "Cobertura", body: "Envíos a toda la República. Entrega local sin costo en CDMX y Área Metropolitana." },
];

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6">
      <header className="rounded-[28px] bg-white px-6 py-10 shadow-card sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Contacto</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
          Hablemos de cerveza.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          ¿Buscas una recomendación, un regalo o tienes una duda con tu pedido? Escríbenos por el canal que
          prefieras y te respondemos con gusto.
        </p>
      </header>

      <ContactChannels />

      <div className="grid gap-4 sm:grid-cols-2">
        {DETAILS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex gap-4 rounded-[28px] bg-white p-6 shadow-card">
            <Icon size={20} className="mt-0.5 shrink-0 text-muted" />
            <div>
              <h2 className="font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
