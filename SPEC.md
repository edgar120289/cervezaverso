# Cervezaverso: Master Technical Specification & Architecture Guide

## Contexto
Estás trabajando en Cervezaverso, un e-commerce premium de cerveza artesanal. Tu objetivo es auditar el código existente, aplicar el Design System estrictamente delineado (Taste Skill / Emil Kowalski) y programar las reglas de negocio.

## FASE 1: Aplicación del Design System (STRICT ENFORCEMENT)
Refactoriza la UI existente para que cumpla estrictamente con el sistema "Floating shopping constellation on white marble".
- Radios: 28px para tarjetas de producto. 9999px (pill) para inputs, botones y chips.
- Sombras: Doble capa suave rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px. SIN bordes visibles en tarjetas.
- Colores: Fondo --color-canvas-mist (#f2f4f5). Superficie de tarjetas blanca (#ffffff). Acento Violeta Shop (#5433eb) solo en botones de acción principales.
- Tipografía: GT Standard o Inter (fallback) con tracking negativo tight (-0.03em a -0.05em). Usa pesos regulares y semibold, nunca bold extra pesados.
- Composición de producto: Imágenes de producto al 100% del ancho con radio interno de 20px. Las tarjetas flotan en la cuadrícula.

## FASE 2: Regla de Precios Automática
Crea una utilidad/helper que calcule el Precio de Venta al Público usando la columna `cost_price`:
Regla estricta: `Math.floor((costPrice * 1.5) / 5) * 5` (Margen del 50%, redondeado hacia abajo al múltiplo de 5 más cercano, sin decimales). Muestra este precio en el catálogo.

## FASE 3: El "Sommelier Digital" (Contenido Generado por IA)
Crea la lógica y UI para que las cervezas muestren contenido premium. Para las que no tengan, prepara un script (`scripts/generate-content.ts`) que use la API de OpenAI/Anthropic para generar:
1. `story`: Historia breve y origen.
2. `profile`: Notas de cata (visual, olfato, gusto).
3. `pairing`: Recomendación de maridaje perfecta.
Muestra esta información elegantemente en la página de detalle de producto.

## FASE 4: Componente de Video Dinámico (Cinemagraph B-Roll)
Crea un componente `HeroVideoBackground.tsx` con un video B-Roll (ej. cerveza sirviéndose, espuma perfecta) en loop, muted y playsInline. Debe tener un overlay oscuro sutil para que el texto resalte. Úsalo en la vista de producto o hero de la tienda.

## FASE 5: Age Gate (Cumplimiento Legal México)
Implementa un modal de verificación de edad (+18) al montar la app, con diseño impecable (bordes 28px, botones 9999px, colores del design system). Guarda una cookie para no volver a preguntarle al usuario.

## FASE 6: Checkout y Pagos
Implementa el flujo de checkout optimizado, integra cotización de envío y pagos con Mercado Pago o Stripe (sandbox) validando formularios en el servidor (Zod).
