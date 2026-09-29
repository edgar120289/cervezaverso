import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { FLAT_SHIPPING_COST, formatMXN, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso y de compra en Cervezaverso.",
  alternates: { canonical: "/terminos" },
};

const DUMMY =
  "Texto de ejemplo pendiente de redacción. Aquí se describirán las condiciones aplicables a este apartado.";

export default function TerminosPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro={<p>Las reglas claras de nuestra relación: cómo compras, cómo enviamos y qué puedes esperar de nosotros.</p>}
      updatedAt="25 de septiembre de 2026"
      sections={[
        {
          id: "mayores-de-edad",
          title: "Venta exclusiva a mayores de edad",
          body: (
            <p>
              La venta de bebidas alcohólicas es exclusiva para personas mayores de 18 años. {DUMMY}
            </p>
          ),
        },
        { id: "pedidos-y-pagos", title: "Pedidos y pagos", body: <p>{DUMMY}</p> },
        {
          id: "codigos-y-tarjetas-de-regalo",
          title: "Códigos de descuento y tarjetas de regalo",
          body: (
            <p>
              Un código por pedido. Las tarjetas de regalo de monto fijo se aplican sobre el subtotal de productos; si
              el pedido es menor al monto, el saldo restante no se conserva. {DUMMY}
            </p>
          ),
        },
        {
          id: "envios",
          title: "Envíos",
          body: (
            <p>
              Envío nacional de {formatMXN(FLAT_SHIPPING_COST)} en pedidos menores a{" "}
              {formatMXN(FREE_SHIPPING_THRESHOLD)}; gratis a partir de ese monto. Envío local sin costo en CDMX y
              Área Metropolitana. {DUMMY}
            </p>
          ),
        },
        { id: "devoluciones", title: "Cambios, devoluciones y cancelaciones", body: <p>{DUMMY}</p> },
        { id: "propiedad-intelectual", title: "Propiedad intelectual", body: <p>{DUMMY}</p> },
        {
          id: "contacto",
          title: "Contacto",
          body: (
            <p>
              ¿Dudas sobre estos términos? Escríbenos desde la página de{" "}
              <Link href="/contacto" className="font-semibold text-accent hover:underline">
                contacto
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
