import { getProducts } from "@/lib/catalog";
import { COUNTRY_CATEGORIES, STYLE_CATEGORIES, productsInCountry, productsInStyle } from "@/lib/seo-categories";
import { SITE } from "@/lib/site";

/** Resumen en Markdown del sitio para rastreadores de IA (https://llmstxt.org). */
export async function GET() {
  const catalog = await getProducts();
  const countries = COUNTRY_CATEGORIES.filter((c) => productsInCountry(catalog, c).length > 0);
  const styles = STYLE_CATEGORIES.filter((c) => productsInStyle(catalog, c).length > 0);

  const body = `# ${SITE.name}

> Tienda en línea de cerveza artesanal e importada de diversos países: un multiverso de estilos para descubrir y comprar desde México. La venta es exclusiva para mayores de 18 años.

## Envíos

Envío a toda la República Mexicana con tiempo de entrega de 3 a 6 días hábiles. Procesamiento prioritario pagando con transferencia.

## Tienda

- [Tienda](${SITE.url}/tienda): catálogo completo con búsqueda y filtros por país, cervecería, precio y grado de alcohol.
- [Contacto](${SITE.url}/contacto): canales de atención.

## Cerveza por país

${countries.map((c) => `- [Cerveza de ${c.name}](${SITE.url}/catalogo/pais/${c.slug})`).join("\n")}

## Cerveza por estilo

${styles.map((s) => `- [${s.heading}](${SITE.url}/catalogo/estilo/${s.slug})`).join("\n")}

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
