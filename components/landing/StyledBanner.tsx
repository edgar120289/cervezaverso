import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import CtaLink from "@/components/CtaLink";
import type { HeroCta } from "@/lib/hero";
import type { BlockStyle } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import {
  ALIGN_COLUMN,
  ALIGN_ROW,
  ALIGN_SELF,
  BANNER_TITLE_CLASS,
  SUBTITLE_CLASS,
  TEXT_SHADOW,
  ctaLook,
} from "./banner-style";
import ProductSpotlight from "./ProductSpotlight";

type StyledBannerProps = {
  title?: string | null;
  subtitle?: string | null;
  ctas: HeroCta[];
  style: BlockStyle;
  imageUrl?: string | null;
  imageAlt?: string;
  /** Fondo propio (por ejemplo, un video con `absolute inset-0`); sustituye a la imagen. */
  media?: ReactNode;
  /** Producto ya resuelto para "Cerveza destacada"; sin él (o con el interruptor apagado) no hay tarjeta. */
  product?: Product | null;
  /** Etiqueta del título: `h1` en la portada (si falta el título, queda un H1 solo para lectores de pantalla). */
  headingTag?: "h1" | "h2" | "div";
  headingId?: string;
  priority?: boolean;
  /** El banner de impacto usa el acento de la marca como fondo cuando no hay imagen. */
  accentBackdrop?: boolean;
  id?: string;
  ariaLabel?: string;
};

/**
 * Banner configurable desde /admin/landing, común al Hero y al banner de impacto. Dos disposiciones:
 * foto de fondo completo (con capa oscura de 0 a 100 %) o dividido 50/50 (texto a un lado, imagen o
 * producto al otro). Todo es fluido: el texto se reacomoda en móvil y la imagen cubre sin tamaños fijos.
 */
export default function StyledBanner({
  title,
  subtitle,
  ctas,
  style,
  imageUrl,
  imageAlt = "",
  media,
  product,
  headingTag = "h2",
  headingId,
  priority = false,
  accentBackdrop = false,
  id,
  ariaLabel,
}: StyledBannerProps) {
  const isSplit = style.layout === "split";
  const onDark = !isSplit;
  const hasMedia = Boolean(media) || Boolean(imageUrl);

  const heading = title?.trim();
  const sub = subtitle?.trim();
  const Heading = headingTag;
  const fallbackFill = accentBackdrop && !isSplit && !hasMedia ? "#ffffff" : undefined;

  const titleStyle: CSSProperties | undefined = style.title_color ? { color: style.title_color } : undefined;
  const subtitleStyle: CSSProperties | undefined = style.subtitle_color ? { color: style.subtitle_color } : undefined;

  const mediaNode =
    media ??
    (imageUrl ? (
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        priority={priority}
        sizes={isSplit ? "(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1152px) 1152px, 100vw"}
        className="object-cover object-center"
      />
    ) : null);

  const text = (
    <div
      className={`flex w-full max-w-3xl flex-col gap-4 ${ALIGN_COLUMN[style.align]} ${ALIGN_SELF[style.align]} ${
        onDark ? TEXT_SHADOW : ""
      }`}
    >
      {heading ? (
        <Heading
          id={headingId}
          style={titleStyle}
          className={`text-balance break-words font-semibold leading-[1.05] tracking-[-0.04em] ${BANNER_TITLE_CLASS[style.title_size]} ${
            onDark ? "text-white" : "text-black"
          }`}
        >
          {heading}
        </Heading>
      ) : (
        headingTag === "h1" && <h1 className="sr-only">Cervezaverso</h1>
      )}
      {sub && (
        <p
          style={subtitleStyle}
          className={`max-w-xl text-pretty ${SUBTITLE_CLASS[style.subtitle_size]} ${onDark ? "text-white/90" : "text-muted"}`}
        >
          {sub}
        </p>
      )}
      {ctas.length > 0 && (
        <div className={`mt-2 flex w-full flex-wrap items-center gap-3 ${ALIGN_ROW[style.align]}`}>
          {ctas.map((cta, index) => {
            const look = ctaLook(style, index, onDark, fallbackFill);
            return (
              <CtaLink key={`${cta.text}-${index}`} cta={cta} className={look.className} style={look.style}>
                {look.arrow ? `${cta.text} →` : undefined}
              </CtaLink>
            );
          })}
        </div>
      )}
    </div>
  );

  const card =
    style.spotlight.enabled && product ? <ProductSpotlight product={product} badge={style.spotlight.badge} /> : null;
  const hasText = Boolean(heading || sub || ctas.length > 0);

  if (isSplit) {
    const mediaFirst = style.align === "right";
    const hasSide = hasMedia || card !== null;
    return (
      <section
        id={id}
        aria-label={ariaLabel}
        className={`scroll-mt-24 grid overflow-hidden rounded-[28px] bg-white shadow-card ${
          hasSide && hasText ? "md:grid-cols-2" : ""
        }`}
      >
        {hasText && <div className={`flex items-center p-6 sm:p-10 lg:p-14 ${mediaFirst ? "md:order-2" : ""}`}>{text}</div>}
        {hasSide && (
          <div
            className={`relative min-h-72 md:min-h-[26rem] ${card ? "flex items-center bg-canvas p-6" : "bg-neutral-900"} ${
              mediaFirst ? "md:order-1" : ""
            }`}
          >
            {card ?? mediaNode}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`relative isolate flex min-h-[26rem] scroll-mt-24 items-center overflow-hidden rounded-[28px] shadow-card sm:min-h-[30rem] lg:min-h-[34rem] ${
        accentBackdrop ? "bg-accent" : "bg-neutral-900"
      }`}
    >
      {mediaNode && <div className="absolute inset-0 z-0">{mediaNode}</div>}
      {style.overlay > 0 && (
        <div aria-hidden className="absolute inset-0 z-0" style={{ backgroundColor: `rgb(0 0 0 / ${style.overlay / 100})` }} />
      )}
      <div
        className={`relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:px-10 sm:py-16 ${
          card ? "lg:grid-cols-2 lg:items-center" : ""
        }`}
      >
        {hasText && <div className={card && style.align === "right" ? "lg:order-2" : ""}>{text}</div>}
        {card}
      </div>
    </section>
  );
}
