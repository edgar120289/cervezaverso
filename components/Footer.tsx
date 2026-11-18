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

/** Columna 1: tienda. */
const SHOP_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/directorio", label: "Todas las cervezas" },
  { href: "/envios", label: "Envíos y pagos" },
  { href: "/faq", label: "Preguntas Frecuentes" },
];

/** Columna 2: ayuda y legal (cierra con «Configurar cookies», que es un botón). */
const HELP_LINKS = [
  { href: "/contacto", label: "Contacto" },
  { href: "/login", label: "Mi cuenta" },
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Aviso de privacidad" },
];

/**
 * Lo que acepta el checkout: Checkout Pro de Mercado Pago sin exclusiones (tarjetas Visa,
 * Mastercard y American Express, efectivo en OXXO y SPEI) y transferencia SPEI directa.
 * SVG locales en public/pagos/; SPEI va como texto porque no hay logo oficial en SVG.
 */
const PAYMENT_LOGOS = [
  { src: "/pagos/mercadopago.svg", alt: "Mercado Pago", width: 35 },
  { src: "/pagos/visa.svg", alt: "Visa", width: 74 },
  { src: "/pagos/mastercard.svg", alt: "Mastercard", width: 39 },
  { src: "/pagos/americanexpress.svg", alt: "American Express", width: 24 },
  { src: "/pagos/oxxo.svg", alt: "OXXO", width: 47 },
];

// 44 px de objetivo táctil; con mouse (pointer-fine) bastan 32 px y el footer queda más bajo.
const LINK_CLASS =
  "inline-flex min-h-11 items-center py-1 text-left leading-tight transition-colors hover:text-black pointer-fine:min-h-8";

type FooterLink = { href: string; label: string };

function LinkColumn({ links, children }: { links: FooterLink[]; children?: React.ReactNode }) {
  return (
    <ul className="flex flex-col items-start">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={LINK_CLASS}>
            {link.label}
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}

function PaymentMethods() {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">Pagos seguros con</p>
      <ul className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2" aria-label="Métodos de pago aceptados">
        {PAYMENT_LOGOS.map((logo) => (
          <li key={logo.src} className="flex h-6 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local de 24 px; no necesita optimización */}
            <img src={logo.src} alt={logo.alt} width={logo.width} height={24} className="h-6 w-auto" loading="lazy" />
          </li>
        ))}
        <li className="flex h-6 items-center rounded border border-black/15 px-1.5 text-[11px] font-bold tracking-wide text-black/70">
          SPEI
        </li>
      </ul>
    </div>
  );
}

type FooterProps = {
  logoImages: string[];
  logoFrame: string;
};

export default function Footer({ logoImages, logoFrame }: FooterProps) {
  return (
    <footer className="mt-16 px-4 pb-24">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-white px-5 py-8 shadow-card sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <MultiverseLogo images={logoImages} frame={logoFrame} size={72} />
              <div>
                <p className="text-lg font-semibold tracking-tight">Cervezaverso</p>
                <p className="mt-1 text-sm text-muted">El placer del deber cumplido.</p>
              </div>
            </div>
            <PaymentMethods />
          </div>

          <nav aria-label="Enlaces del sitio" className="text-sm font-semibold text-black/65">
            <div className="grid grid-cols-[auto_auto] justify-start gap-x-5 sm:gap-x-14">
              <LinkColumn links={SHOP_LINKS} />
              <LinkColumn links={HELP_LINKS}>
                <li>
                  <CookieSettingsButton className={`${LINK_CLASS} font-semibold`} />
                </li>
              </LinkColumn>
            </div>
          </nav>
        </div>

        <div className="mt-6 flex flex-col-reverse items-start gap-4 border-t border-black/5 pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
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
