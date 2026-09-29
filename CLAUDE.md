@AGENTS.md

Nombre del Proyecto: Cervezaverso
Tipo: Tienda en línea (E-commerce)
Fase Actual: 1 - Plan presentado, pendiente de OK (ver sección Estado).

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

- Fase actual: 1 · Plan presentado (2026-09-29), **pendiente de OK**. Sin código nuevo hasta aprobarlo.
- Siguiente: Fase 2 · Base + corrección de piezas existentes (ver Plan).
- Ya existe en el repo, sin auditar contra las reglas globales: catálogo con filtros, ficha de producto, carrito, checkout (sin pago en línea), cuenta de cliente, recuperación de contraseña, panel de admin (productos, pedidos, cupones, importación de la lista de precios), Sommelier por cuestionario, modal de mayoría de edad, páginas de Privacidad, Términos y Contacto, sitemap, robots y Open Graph. `tsc` y ESLint limpios al 2026-09-29.
- Pendiente de construir (fases siguientes): pago con Mercado Pago, Sommelier con la API de OpenAI y Tarjetas de Regalo.
- Última actualización: 2026-09-29.

## Decisiones

- 2026-09-29 · Este CLAUDE.md describe la visión final del proyecto, no solo lo ya construido.
- 2026-09-29 · El Sommelier actual (cuestionario con reglas en `lib/sommelier.ts`) se migrará a la API de OpenAI en una fase posterior; es una funcionalidad nueva.
- 2026-09-29 · Las Tarjetas de Regalo son una funcionalidad nueva con su propio modelo de datos (saldo consumible), independiente de los cupones de descuento (`004_promo_codes.sql`).
- 2026-09-29 · `brand/design-system.md` (Shop) es solo referencia de arquitectura UI: radios de 28px en tarjetas y 9999px en botones, sombras suaves, densidad compacta y un solo color de acento. La tipografía será Inter o fuentes del sistema (sin GT Standard ni Shopify Sans, que requieren licencia); los logotipos son propios de Cervezaverso.
- 2026-09-29 · Se conserva `@AGENTS.md` al inicio de este archivo por los cambios importantes de esta versión de Next.js.
- 2026-09-29 · Las hojas de cálculo (`*.xlsx`) no se versionan: la lista de precios del proveedor es confidencial y se eliminó del historial.
- 2026-09-29 · Orden: se cierra el Plan; en la Fase 2 se deja la base (seguridad, SEO, legal) y se corrigen las piezas existentes en lugar de reconstruirlas.
- 2026-09-29 · Modal único de edad y cookies: botón principal "Sí, tengo +18 y acepto" (edad + todas las cookies); debajo, enlaces discretos "Solo esenciales" (confirma +18 y rechaza analítica) y "Configurar cookies". Google Analytics solo carga tras aceptar. Separar el consentimiento de cookies es requisito legal (LFPDPPP).
- 2026-09-29 · "Soy menor" bloquea el sitio el resto de la sesión, sin opción de volver. Fecha de nacimiento obligatoria en el registro, validada en el servidor (18+). Los Términos exigen identificación oficial al recibir la entrega.
- 2026-09-29 · Color de acento oficial de Cervezaverso: violeta `#5433eb` sobre Canvas Mist `#f2f4f5` (sustituye la idea de una paleta distinta a la de la referencia). Sigue la regla de un solo acento saturado.
- 2026-09-29 · Buscador del header: campo (ícono en móvil) que lleva a `/?q=…#catalogo` y reutiliza los filtros existentes, sin dependencias nuevas.
- 2026-09-29 · La lista de costos de Monasterio ya incluye IVA e IEPS. Precio de venta = costo × (1 + margen/100), redondeado hacia abajo al múltiplo de 5; margen por defecto 50%. Es la regla ya implementada en `lib/pricing.ts`.
- 2026-09-29 · Leyenda sanitaria "El abuso en el consumo de este producto es nocivo para la salud." en Footer, ficha de producto y checkout (pendiente de revisión legal).
- 2026-09-29 · Pagos: Mercado Pago (tarjetas, SPEI y OXXO Pay) con checkout alojado. El pago se da por confirmado solo con el webhook de firma verificada; el correo es notificación, no confirmación. Se descarta Stripe.
- 2026-09-29 · Plataforma: se mantiene la arquitectura a la medida (Next.js + Supabase + Tailwind); no se migra a Shopify.
