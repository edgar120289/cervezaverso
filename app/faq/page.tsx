import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";
import FaqContactForm from "@/components/FaqContactForm";
import { FAQ_ITEMS } from "@/lib/faq";
import { CONTACT, SOMMELIER_MASCOT, SOMMELIER_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resuelve tus dudas sobre envíos, formas de pago, venta a mayores de 18 años y compra en línea en Cervezaverso.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="grid items-center gap-6 rounded-[28px] bg-white px-6 py-10 shadow-card sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-12 sm:py-14">
        <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40">
          <Image src={SOMMELIER_MASCOT} alt="" fill sizes="160px" className="object-contain" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Ayuda</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
            Preguntas frecuentes
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            ¡Hola! Soy {SOMMELIER_NAME}. Aquí encuentras lo que más nos preguntan; si no está tu duda, escríbenos
            abajo.
          </p>
        </div>
      </header>

      <section aria-label="Preguntas y respuestas" className="space-y-3">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <details key={question} className="group rounded-[28px] bg-white px-6 py-2 shadow-card">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted">{answer}</p>
          </details>
        ))}
      </section>

      <section aria-labelledby="contacto-directo" className="rounded-[28px] bg-white p-6 shadow-card sm:p-10">
        <h2 id="contacto-directo" className="text-2xl font-semibold tracking-[-0.04em]">
          ¿Sigues con dudas?
        </h2>
        <p className="mt-2 text-muted">Elige cómo prefieres escribirnos. Atendemos de lunes a domingo, de 9:00 a 21:00.</p>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="flex flex-col items-start gap-3">
            <MessageCircle size={22} className="text-muted" />
            <h3 className="font-semibold tracking-tight">Por WhatsApp</h3>
            <p className="text-sm text-muted">La forma más rápida de resolver tu duda.</p>
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex min-h-14 w-full items-center justify-center rounded-full bg-accent px-8 text-base font-semibold text-white shadow-accent transition hover:brightness-110"
            >
              Escribir al {CONTACT.whatsappLabel}
            </a>
          </div>
          <div className="space-y-3">
            <Mail size={22} className="text-muted" />
            <h3 className="font-semibold tracking-tight">Por correo</h3>
            <FaqContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
