---
name: entrega
description: Genera la documentación de entrega del proyecto web (resumen para el cliente y ficha técnica). Úsala cuando el usuario dé por terminado el proyecto o pida el entregable final.
---

Si `docs/AUDITORIA.md` no existe o tiene puntos ❌, avísame antes de seguir.

Genera `docs/ENTREGA.md` a partir del estado real del repositorio, no de memoria ni del plan: lee el código, la configuración, el brief, `docs/AUDITORIA.md` y el historial de git. Lo que no puedas comprobar, márcalo "por confirmar". Nunca incluyas valores de secretos, contraseñas ni tokens: solo nombres de variables.

## Parte A · Resumen para el cliente (sin tecnicismos, máx. una página)
- Qué se construyó y para qué: objetivo, público y CTA principal.
- Páginas y funciones: tabla con página, propósito y qué puede hacer el visitante.
- Qué incluye en seguridad, legal, SEO, velocidad y accesibilidad, dicho como beneficios y con las puntuaciones finales de Lighthouse.
- Cómo se mide el éxito: qué registra la analítica y dónde consultarlo.
- Qué le toca al cliente: pendientes, accesos por transferir y revisión legal.

## Parte B · Ficha técnica
1. Stack y versiones exactas (de `package.json`).
2. Mapa del sitio: árbol de rutas públicas, privadas y de API, con el propósito de cada una.
3. Estructura del código: árbol de carpetas comentado (2 o 3 niveles) y dónde vive cada cosa: componentes, tokens y estilos, contenido, lógica de servidor y validaciones.
4. Arquitectura y flujo de datos: diagrama Mermaid de formularios, pagos, login, webhooks y correos, según aplique.
5. Servicios externos: proveedor, para qué se usa, dónde se configura y a nombre de quién está la cuenta.
6. Variables de entorno: nombre, para qué sirve y dónde se obtiene.
7. Seguridad implementada: cada medida y en qué parte del código está.
8. SEO, rendimiento y accesibilidad: qué se implementó y los resultados medidos.
9. Legal: páginas, fecha de versión y estado de revisión.
10. Despliegue: hosting, dominio, DNS, SSL, cómo publicar un cambio y cómo revertirlo.
11. Mantenimiento: cómo editar contenido, actualizar dependencias, respaldos (si hay datos) y qué revisar cada mes.
12. Pendientes, riesgos conocidos y mejoras recomendadas, en orden de prioridad.
13. Traspaso y post-lanzamiento: accesos por entregar (hosting, dominio, analítica, pasarela, correo y repositorio) por un canal seguro, alta en Google Search Console con el sitemap y analítica verificada en producción.

Actualiza también `README.md` con instalación, comandos y un enlace a `docs/ENTREGA.md` (máx. 30 líneas). Comprueba que cada ruta, archivo y comando que mencionas exista, haz commit, actualiza el Estado y dame un resumen de 5 líneas con la ruta del documento.
