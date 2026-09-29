import type { Metadata } from "next";
import { Clock, Mail, MapPin, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/SocialIcons";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp, Instagram o Facebook. Te ayudamos a elegir tu cerveza y con tus pedidos.",
  alternates: { canonical: "/contacto" },
};

type Channel = {
  icon: ComponentType<{ size?: number; className?: string }> | LucideIcon;
  title: string;
  detail: string;
  description: string;
  href: string;
  cta: string;
  primary?: boolean;
};

const CHANNELS: Channel[] = [
  {
    icon: WhatsAppIcon,
    title: "WhatsApp",
    detail: CONTACT.whatsappLabel,
    description: "La vía más rápida para dudas de pedidos, envíos y recomendaciones.",
    href: CONTACT.whatsappUrl,
    cta: "Abrir chat",
    primary: true,
  },
  {
    icon: InstagramIcon,
    title: "Instagram",
    detail: CONTACT.handle,
    description: "Lanzamientos, catas y lo nuevo del multiverso.",
    href: CONTACT.instagramUrl,
    cta: "Seguir",
  },
  {
    icon: FacebookIcon,
    title: "Facebook",
    detail: CONTACT.handle,
    description: "Novedades, promociones y comunidad cervecera.",
    href: CONTACT.facebookUrl,
    cta: "Visitar",
  },
  ...(CONTACT.email
    ? [
        {
          icon: Mail,
          title: "Correo",
          detail: CONTACT.email,
          description: "Facturación, mayoreo y alianzas.",
          href: `mailto:${CONTACT.email}`,
          cta: "Escribir",
        },
      ]
    : []),
];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, title, detail, description, href, cta, primary }) => (
          <a
            key={title}
            href={href}
            target={href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className={`group flex flex-col rounded-[28px] p-6 shadow-card transition-transform hover:-translate-y-1 ${
              primary ? "bg-accent text-white shadow-accent" : "bg-white"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                primary ? "bg-white/15" : "bg-canvas text-black/70"
              }`}
            >
              <Icon size={22} />
            </span>
            <p className="mt-5 text-lg font-semibold tracking-tight">{title}</p>
            <p className={`text-sm font-semibold ${primary ? "text-white" : "text-muted"}`}>{detail}</p>
            <p className={`mt-2 flex-1 text-sm leading-relaxed ${primary ? "text-white/95" : "text-muted"}`}>
              {description}
            </p>
            <span className={`mt-5 text-sm font-semibold ${primary ? "" : "text-accent"}`}>
              {cta} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </span>
          </a>
        ))}
      </div>

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
