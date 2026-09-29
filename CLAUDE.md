@AGENTS.md

Nombre del Proyecto: Cervezaverso
Tipo: Tienda en línea (E-commerce)
Fase Actual: 1 - Plan. Revisión de infraestructura base y consolidación de características.

Stack Tecnológico:

Frontend: Next.js, React, TypeScript, Tailwind CSS.

Backend / Base de Datos: Supabase (con migraciones SQL en curso).

Despliegue: Vercel.

Calidad de Código: ESLint.

Regulaciones y Seguridad:

Giro Regulado: Venta de Alcohol.

Requisito Obligatorio: Modal estricto de verificación de mayoría de edad antes de acceder al catálogo, y leyendas de consumo responsable en todo el sitio.

Seguridad: Validación del lado del servidor para transacciones, protección contra XSS, y variables de entorno protegidas.

Arquitectura y Funcionalidades Clave:

Sistema avanzado de filtrado de catálogo de cervezas artesanales.

Integración de tarjetas de regalo (Gift Cards).

Sommelier Digital impulsado por la API de OpenAI.

Lineamientos de Diseño (UI/UX):

Identidad: Estilo de línea minimalista, interfaces suaves con bordes muy redondeados (28px en tarjetas, 9999px en botones).

Referencia de Estilo Principal: Lee las directrices exactas y los tokens de diseño en /brand/design-system.md. Toma esto como base estructural (radios, sombras, espaciado), adaptando tipografía a 'Inter' y paleta a la marca Cervezaverso.

Elementos Visuales: Plantas de lúpulo, tarros de cerveza y tipografía limpia.

Calidad Visual: Corrección estricta de contrastes de color, diseño responsivo nativo (mobile-first), y compresión de imágenes.

## Estado

- Fase actual: 1 - Plan (pendiente de `/arranque`; sin código nuevo hasta aprobarlo).
- Ya existe en el repo, sin auditar contra las reglas globales: catálogo con filtros, ficha de producto, carrito, checkout, cuenta de cliente, recuperación de contraseña, panel de admin (productos, pedidos, cupones, importación de la lista de precios), Sommelier por cuestionario, modal de mayoría de edad, páginas de Privacidad, Términos y Contacto, sitemap, robots y Open Graph.
- Pendiente de construir (fases siguientes): Sommelier con la API de OpenAI y modelo de datos de Tarjetas de Regalo.
- Última actualización: 2026-09-29.

## Decisiones

- 2026-09-29 · Este CLAUDE.md describe la visión final del proyecto, no solo lo ya construido.
- 2026-09-29 · El Sommelier actual (cuestionario con reglas en `lib/sommelier.ts`) se migrará a la API de OpenAI en una fase posterior; es una funcionalidad nueva.
- 2026-09-29 · Las Tarjetas de Regalo son una funcionalidad nueva con su propio modelo de datos (saldo consumible), independiente de los cupones de descuento (`004_promo_codes.sql`).
- 2026-09-29 · `brand/design-system.md` (Shop) es solo referencia de arquitectura UI: radios de 28px en tarjetas y 9999px en botones, sombras suaves, densidad compacta y un solo color de acento. La tipografía será Inter o fuentes del sistema (sin GT Standard ni Shopify Sans, que requieren licencia); la paleta y los logotipos serán propios de Cervezaverso.
- 2026-09-29 · Se conserva `@AGENTS.md` al inicio de este archivo por los cambios importantes de esta versión de Next.js.
- 2026-09-29 · Las hojas de cálculo (`*.xlsx`) no se versionan: la lista de precios del proveedor es confidencial y se eliminó del historial.
