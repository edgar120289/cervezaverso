import Link from "next/link";
import MultiverseLogo from "./MultiverseLogo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";
import { CONTACT } from "@/lib/site";

const SOCIAL_LINKS = [
  { icon: InstagramIcon, href: CONTACT.instagramUrl, label: `Instagram ${CONTACT.handle}` },
  { icon: FacebookIcon, href: CONTACT.facebookUrl, label: `Facebook ${CONTACT.handle}` },
  { icon: WhatsAppIcon, href: CONTACT.whatsappUrl, label: "WhatsApp" },
];

const FOOTER_LINKS = [
  { href: "/#catalogo", label: "Catálogo" },
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
              <p className="mt-1 text-sm text-black/50">El placer del deber cumplido.</p>
            </div>
          </div>

          <nav aria-label="Enlaces del sitio">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-black/60 md:max-w-sm md:justify-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center gap-5 border-t border-black/5 pt-6 text-xs text-black/40 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} Cervezaverso. Todos los derechos reservados.</p>
            <p className="mt-1">Venta exclusiva para mayores de 18 años. Evita el exceso.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1 font-semibold text-black/50">{CONTACT.handle}</span>
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f5] text-black/60 transition-colors hover:bg-black hover:text-white"
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
