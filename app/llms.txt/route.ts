import { COUNTRY_CATEGORIES, STYLE_CATEGORIES } from "@/lib/seo-categories";
import { CONTACT, LEGAL, SITE } from "@/lib/site";

/** Resumen en Markdown del sitio para rastreadores de IA (https://llmstxt.org). */
export async function GET() {
  const body = `# ${SITE.name}

> Tienda en línea de cerveza artesanal e importada de diversos países, con envío a domicilio en CDMX y todo México (razón social: ${LEGAL.razonSocial}). La venta es exclusiva para mayores de 18 años.

## Datos del negocio

- Venta solo en línea: no hay atención al público ni recolección en el local. Todos los pedidos se entregan a domicilio.
- Horario de atención: lunes a domingo, de 9:00 a 21:00.
- WhatsApp: ${CONTACT.whatsappLabel}
- Correo: ${CONTACT.email} (facturación: ${LEGAL.emailFacturas})
- Instagram: ${CONTACT.instagramUrl}
- Facebook: ${CONTACT.facebookUrl}

## Envíos

- CDMX y zona metropolitana: gratis en pedidos desde $1,000; $150 en pedidos menores. Entrega en 24 a 48 horas.
- Resto de la República: gratis desde $3,000; $150 en pedidos menores. Entrega en 3 a 6 días hábiles por paquetería.
- Los pedidos se procesan en un máximo de 24 horas; con transferencia, el proceso es más rápido.
- [Envíos y pagos](${SITE.url}/envios)

## Formas de pago

- Mercado Pago: tarjeta de crédito o débito, SPEI y efectivo en OXXO.
- Transferencia bancaria.

## Descuento por volumen

En compras mayores a $6,000 en productos se descuenta 10% automáticamente sobre el subtotal. No es acumulable con códigos de descuento, cupones del programa de premios ni otras promociones.

## Programa de premios

Con la sesión iniciada, el cliente ve su avance en Mi cuenta. Cuando se procesa el pedido y se confirma el pago, se suman a su avance las botellas que compró. Cada 20 botellas se desbloquea un cupón con un beneficio distinto, por ejemplo una pieza de cristalería o 10% de descuento en el siguiente pedido. Al llegar a 60 botellas se desbloquean nuevos niveles.

## Tienda

- [Tienda](${SITE.url}/tienda): catálogo completo con búsqueda y filtros por país, cervecería, precio y grado de alcohol.
- [Preguntas frecuentes](${SITE.url}/faq)
- [Contacto](${SITE.url}/contacto)

## Cerveza por país

${COUNTRY_CATEGORIES.map((c) => `- [Cerveza de ${c.name}](${SITE.url}/catalogo/pais/${c.slug})`).join("\n")}

## Cerveza por estilo

${STYLE_CATEGORIES.map((s) => `- [${s.heading}](${SITE.url}/catalogo/estilo/${s.slug})`).join("\n")}

## Políticas

- [Términos y condiciones](${SITE.url}/terminos)
- [Aviso de privacidad](${SITE.url}/privacidad)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
