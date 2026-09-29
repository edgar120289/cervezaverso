---
name: arranque
description: Inicia un proyecto web. Revisa el brief, hace las preguntas pendientes, presenta el plan (Fase 1) y, con mi OK, monta la base (Fase 2).
disable-model-invocation: true
---

Lee el CLAUDE.md del proyecto (brief y Estado) y revisa la carpeta: marca, contenido y código existente. Si el Estado indica que el plan ya está aprobado, no repitas nada y continúa con la fase pendiente.

## Fase 1 · Plan (sin escribir código)
1. Busca huecos, contradicciones y riesgos en el brief, sobre todo entre tipo de sitio, funciones y hosting. Haz todas las preguntas en un solo mensaje, numeradas y con tu recomendación en cada una.
2. Si el brief trae un "Plan del auditor", no lo rehagas: valídalo y completa solo lo que falte.
3. Con las respuestas, presenta el plan en 60 líneas o menos:
   - **Stack y hosting**: elección, razón y compatibilidad con el tipo de sitio.
   - **A la medida o plataforma** (tiendas y sitios con panel): compara construir contra Shopify, WooCommerce o un CMS según catálogo, inventario, pagos y quién lo administrará, y recomienda uno.
   - **Mapa del sitio**: páginas, secciones de cada una y su CTA.
   - **Arquitectura**: carpetas, qué datos van en base de datos y cuáles son estáticos, integraciones y variables de entorno (solo nombres).
   - **Dirección de diseño**: concepto en una frase, referencias, paleta con roles, tipografías, elemento distintivo, criterio de animación y qué skill de diseño se usa en cada fase.
   - **Dependencias**: lista mínima, con una línea de justificación por paquete.
   - **Pendientes y riesgos**: contenido faltante, requisitos legales o del giro, bloqueos.
4. Anota las decisiones en el CLAUDE.md del proyecto, cierra con el reporte de fase y espera OK.

## Fase 2 · Base (con el plan aprobado)
Antes de construir páginas, deja listo y verificado:
- [ ] Git inicializado, con `.gitignore` que excluye `.env*` salvo `.env.example`. Crea `.env.example` con los nombres de las variables; yo creo `.env.local` con los valores.
- [ ] Proyecto con TypeScript estricto, lint y los scripts `dev`, `build`, `lint` y `typecheck` funcionando, sin restos del template.
- [ ] Sistema de diseño: tokens de color, tipografía, espaciado, radios, sombras y animación (duraciones y curvas) en un solo lugar. Si Impeccable está instalado, corre `/impeccable init` respondiendo con el brief (pregúntame solo lo que no diga) para generar PRODUCT.md y DESIGN.md.
- [ ] Layout: header con navegación (también en móvil), footer con contacto y enlaces legales, enlace "saltar al contenido" y `lang="es-MX"`.
- [ ] Seguridad: encabezados y redirección a HTTPS configurados según el hosting (configuración del framework, `_headers`, `.htaccess`…).
- [ ] Formularios: un patrón único con esquema zod compartido, validación en servidor, honeypot, rate limiting, Turnstile en los públicos y mensajes de error accesibles.
- [ ] SEO: plantilla de title, description por defecto, canonical, imagen Open Graph 1200×630, favicon completo (`.ico`, `.svg`, apple-touch de 180 px y manifest), sitemap, robots, página 404 y página de error con la marca.
- [ ] Legal: Aviso de Privacidad, Términos y banner de cookies como borradores marcados; analítica conectada que solo carga tras aceptar, con el evento de conversión del CTA listo.
- [ ] Todas las rutas del mapa creadas con su estructura y `[[PENDIENTE]]` donde falte contenido.

Verifica (build, lint, typecheck y navegación a 360 px y en escritorio), haz commit, actualiza el Estado, reporta y espera OK.
