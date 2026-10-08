import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { FLAT_SHIPPING_COST, formatMXN, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { CONTACT, HEALTH_NOTICE, LEGAL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra en Cervezaverso: mayoría de edad, precios, pagos, envíos, devoluciones y garantías.",
  alternates: { canonical: "/terminos" },
};

const linkClass = "font-semibold text-accent hover:underline";

export default function TerminosPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro={<p>Las reglas claras de nuestra relación: cómo compras, cómo enviamos y qué puedes esperar de nosotros.</p>}
      updatedAt="29 de septiembre de 2026"
      sections={[
        {
          id: "proveedor",
          title: "Quién te vende",
          body: (
            <>
              <p>
                Cervezaverso es una marca operada por {LEGAL.razonSocial}, con RFC {LEGAL.rfc} y domicilio en {LEGAL.domicilio}
              </p>
              <p>
                Atención a clientes por WhatsApp al {CONTACT.whatsappLabel} y en{" "}
                <a href={`mailto:${CONTACT.email}`} className={linkClass}>
                  {CONTACT.email}
                </a>
                , en horario de {LEGAL.horario}
              </p>
              <p>
                Al hacer un pedido aceptas estos términos. Te recomendamos leerlos junto con nuestro{" "}
                <Link href="/privacidad" className={linkClass}>
                  Aviso de privacidad
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "mayores-de-edad",
          title: "Venta exclusiva a mayores de edad",
          body: (
            <>
              <p>
                Vendemos bebidas alcohólicas únicamente a personas mayores de 18 años. Para comprar debes confirmar tu
                fecha de nacimiento, ya sea en tu cuenta o en el checkout.
              </p>
              <p>
                Quien reciba el pedido debe ser mayor de edad y mostrar una identificación oficial vigente con
                fotografía (INE, pasaporte o cédula profesional) al repartidor. Si no se presenta la identificación o
                quien recibe es menor de edad, el pedido no se entrega y regresa a nuestro almacén. En ese caso, nos pondremos en contacto contigo para reprogramar la entrega o
                gestionar la cancelación y el reembolso conforme a la sección de cambios y devoluciones.
              </p>
            </>
          ),
        },
        {
          id: "precios",
          title: "Precios",
          body: (
            <>
              <p>
                Todos los precios están en pesos mexicanos (MXN) e incluyen IVA e IEPS. Antes de confirmar tu pedido
                verás el total a pagar con el costo de envío y, en su caso, el descuento aplicado.
              </p>
              <p>
                El precio que se cobra es el vigente en el momento en que confirmas el pedido. Si por un error evidente
                un producto aparece con un precio que no corresponde, te avisaremos antes de enviarlo y podrás elegir
                entre pagar el precio correcto o cancelar sin costo.
              </p>
            </>
          ),
        },
        {
          id: "pedidos-y-pagos",
          title: "Pedidos y pagos",
          body: (
            <>
              <p>
                Al confirmar tu pedido te mostramos un número de pedido. Por ahora te contactamos para coordinar el
                pago; muy pronto podrás pagar en línea con Mercado Pago (tarjeta de crédito o débito, SPEI y pago en
                efectivo en OXXO).
              </p>
              <p>
                Los pagos en línea se procesan en la página segura de Mercado Pago: Cervezaverso nunca ve ni guarda
                los datos de tu tarjeta. Preparamos tu pedido cuando el pago queda confirmado.
              </p>
              <p>
                Facturación: la emisión de facturas (CFDI) deberá solicitarse estrictamente dentro del mismo mes fiscal en
                que se realizó la compra, enviando la solicitud con los datos fiscales al correo{" "}
                <a href={`mailto:${LEGAL.emailFacturas}`} className={linkClass}>
                  {LEGAL.emailFacturas}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "codigos-de-descuento",
          title: "Códigos de descuento",
          body: (
            <p>
              Puedes usar un código por pedido. Cada código indica su descuento, su compra mínima y su vigencia, y no
              se canjea por dinero. Los códigos de monto fijo se aplican sobre el subtotal de productos; si tu compra
              es menor al monto, la diferencia no se conserva.
            </p>
          ),
        },
        {
          id: "envios",
          title: "Envíos",
          body: (
            <>
              <p>
                Envío nacional por paquetería a toda la República: {formatMXN(FLAT_SHIPPING_COST)} en pedidos menores a{" "}
                {formatMXN(FREE_SHIPPING_THRESHOLD)} y gratis a partir de ese monto. Los pedidos se procesan en un máximo de
                24 horas y se envían a través de FedEx o DHL, con un tiempo estimado de entrega de 3 a 5 días hábiles.
              </p>
              <p>
                Envío local sin costo en Ciudad de México y Estado de México (Área Metropolitana), con entrega en 2 a
                3 días hábiles.
              </p>
              <p>
                Revisa tu dirección antes de confirmar. En caso de no encontrar a nadie en el domicilio, la paquetería
                realizará un intento al día siguiente o pondrá el paquete a disposición del cliente en un punto de
                recolección cercano.
              </p>
            </>
          ),
        },
        {
          id: "devoluciones",
          title: "Cambios, devoluciones y cancelaciones",
          body: (
            <>
              <p>
                Puedes cancelar sin costo mientras tu pedido no haya salido de nuestro almacén; te reembolsamos el
                total por el mismo medio de pago.
              </p>
              <p>
                Si recibes un producto dañado, equivocado o incompleto, avísanos dentro de las 48 horas siguientes a
                la entrega con fotos del producto y del empaque. Te enviamos el producto correcto o te reembolsamos,
                a tu elección, sin costo para ti.
              </p>
              <p>
                También puedes devolver productos sellados y en su empaque original dentro de los 5 días hábiles
                siguientes a la entrega. Por seguridad alimentaria no aceptamos devoluciones de productos abiertos.
                En caso de producto dañado o error de envío, Cervezaverso resolverá el incidente en un plazo máximo de 8
                días (mediante el envío de un reemplazo o reembolso del dinero), asumiendo la responsabilidad directa
                con el cliente. Una vez aprobado, el reembolso se procesará en un plazo de 5 a 15 días hábiles,
                dependiendo de la institución bancaria.
              </p>
            </>
          ),
        },
        {
          id: "garantias",
          title: "Garantía de calidad",
          body: (
            <p>
              Garantizamos que tus cervezas llegan en buen estado y dentro de su fecha de consumo preferente. Si un
              producto presenta un defecto de fábrica, escríbenos y lo reponemos o te reembolsamos.
            </p>
          ),
        },
        {
          id: "consumo-responsable",
          title: "Consumo responsable",
          body: (
            <p>
              {HEALTH_NOTICE} Si vas a manejar, no tomes. Evita el consumo durante el embarazo y la lactancia.
            </p>
          ),
        },
        {
          id: "propiedad-intelectual",
          title: "Propiedad intelectual",
          body: (
            <p>
              La marca Cervezaverso, su logotipo, los tarros ilustrados y los textos del sitio son propiedad de
              {" "}{LEGAL.razonSocial}. Las marcas, etiquetas e imágenes de cada cerveza pertenecen a sus respectivas cervecerías.
            </p>
          ),
        },
        {
          id: "quejas",
          title: "Quejas y legislación aplicable",
          body: (
            <>
              <p>
                Si algo sale mal, escríbenos primero: queremos resolverlo. También puedes acudir a la Procuraduría
                Federal del Consumidor (Profeco) en profeco.gob.mx o al Teléfono del Consumidor 55 5568 8722 (800 468
                8722 sin costo).
              </p>
              <p>
                Estos términos se rigen por las leyes federales de los Estados Unidos Mexicanos, en particular la Ley
                Federal de Protección al Consumidor. Jurisdicción: leyes y tribunales competentes de la Ciudad de México.
              </p>
              <p>
                ¿Dudas? Escríbenos desde la página de{" "}
                <Link href="/contacto" className={linkClass}>
                  contacto
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
