import ContactChannels from "@/components/ContactChannels";

/** Contacto al final de la landing: mismas tarjetas de canales que /contacto. */
export default function ContactSection() {
  return (
    <section id="contacto" aria-labelledby="contacto-inicio" className="scroll-mt-24 space-y-4">
      <header className="rounded-[28px] bg-white px-6 py-10 shadow-card sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Contacto</p>
        <h2
          id="contacto-inicio"
          className="mt-3 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl"
        >
          Hablemos de cerveza.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          ¿Buscas una recomendación, un regalo o tienes una duda con tu pedido? Escríbenos por el canal que
          prefieras y te respondemos con gusto.
        </p>
      </header>
      <ContactChannels />
    </section>
  );
}
