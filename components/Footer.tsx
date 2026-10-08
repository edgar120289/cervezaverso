import Link from "next/link";
import MultiverseLogo from "./MultiverseLogo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";
import { CONTACT, LEGAL } from "@/lib/site";
import HealthNotice from "./HealthNotice";
import CookieSettingsButton from "./CookieSettingsButton";

const SOCIAL_LINKS = [
  { icon: InstagramIcon, href: CONTACT.instagramUrl, label: `Instagram ${CONTACT.handle}` },
  { icon: FacebookIcon, href: CONTACT.facebookUrl, label: `Facebook ${CONTACT.handle}` },
  { icon: WhatsAppIcon, href: CONTACT.whatsappUrl, label: "WhatsApp" },
];

const FOOTER_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Aviso de privacidad" },
  { href: "/login", label: "Mi cuenta" },
];

type FooterProps = {
  logoImages: string[];
  logoFrame: string;
};

export default function Footer({ logoImages, logoFrame }: FooterProps) {
  return (
    <footer className="mt-16 px-4 pb-24">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-white px-8 py-10 shadow-card">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <MultiverseLogo images={logoImages} frame={logoFrame} size={72} />
            <div>
              <p className="text-lg font-semibold tracking-tight">Cervezaverso</p>
              <p className="mt-1 text-sm text-muted">El placer del deber cumplido.</p>
            </div>
          </div>

          <nav aria-label="Enlaces del sitio">
            <ul className="flex flex-wrap justify-center gap-x-5 text-sm font-semibold text-black/65 md:max-w-sm md:justify-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center transition-colors hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="inline-flex min-h-11 items-center font-semibold transition-colors hover:text-black" />
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center gap-5 border-t border-black/5 pt-6 text-xs text-muted sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} {LEGAL.razonSocial} · RFC {LEGAL.rfc}. Todos los derechos reservados.</p>
            <p className="mt-1">Venta exclusiva para mayores de 18 años.</p>
            <HealthNotice className="mt-1" />
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1 font-semibold text-muted">{CONTACT.handle}</span>
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/65 transition-colors hover:bg-black hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
