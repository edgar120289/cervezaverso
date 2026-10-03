import { Mail, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/SocialIcons";
import { CONTACT } from "@/lib/site";

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

/** Tarjetas de canales de contacto: se usan en /contacto y al final de la landing. */
export default function ContactChannels() {
  return (
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
  );
}
