---
name: auditoria
description: Auditoría prelanzamiento (seguridad, legal, SEO, rendimiento, accesibilidad, diseño y conversión). Verifica cada punto con evidencia, corrige lo que falle y entrega el reporte.
disable-model-invocation: true
argument-hint: "[URL publicada, opcional]"
---

Audita el proyecto contra las reglas globales y el brief. Marca cada punto ✅ cumple (si tuviste que corregirlo, anota el commit), ❌ falla y no pudiste corregirlo, ⚠️ requiere acción mía, o N/A si no aplica a este tipo de sitio. Cada marca lleva **evidencia**: salida de un comando, archivo y línea, o una medición. No marques ✅ a ojo cuando una herramienta puede comprobarlo.

Audita el build de producción servido en local. Si me diste una URL ($ARGUMENTS), repite ahí las pruebas de encabezados, HTTPS, enlaces y Lighthouse.

## 1. Seguridad
- [ ] Secretos: `npx @secretlint/quick-start --maskSecrets` sin hallazgos sobre los archivos versionados y la salida del build (`.next/static`, `out` o `dist`). Ninguna variable pública contiene secretos. `git log --all --name-only -- '*.env*'` solo muestra `.env.example`; si alguna vez se commiteó un `.env` real, ⚠️ hay que rotar esas claves.
- [ ] Dependencias: `npm audit --omit=dev` sin vulnerabilidades altas ni críticas, `npm outdated` revisado y ningún paquete sin uso.
- [ ] Inyección y XSS: busca `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, SQL armado con texto y ejecución de comandos; cada caso corregido o justificado.
- [ ] Validación en servidor: cada Server Action, Route Handler y endpoint valida esquema, sesión y permisos. Pruébalo enviando datos inválidos directo al endpoint, sin pasar por el formulario.
- [ ] Formularios: honeypot, rate limiting y Turnstile en los formularios públicos; prueba envíos repetidos.
- [ ] Login: hash argon2id o bcrypt; `Set-Cookie` con HttpOnly, Secure, SameSite y expiración; se rechaza el acceso a datos de otro usuario (prueba cambiando IDs).
- [ ] Pagos: el servidor rechaza un precio alterado en la petición, el webhook verifica la firma y no hay datos de tarjeta en el sistema.
- [ ] Encabezados: `curl -sI` muestra HSTS, CSP, X-Content-Type-Options, Referrer-Policy y Permissions-Policy; HTTP redirige a HTTPS y el certificado es válido.
- [ ] Producción sin trazas de error, logs con datos personales ni rutas de depuración.

## 2. Legal
- [ ] Aviso de Privacidad con todos los elementos de las reglas globales y los datos reales del brief, enlazado en el footer y en cada formulario que pide datos.
- [ ] Términos y Condiciones; en tiendas, con datos del proveedor, precios con impuestos, envíos, devoluciones y garantías.
- [ ] Cookies: sin aceptar no se carga analítica ni marketing (compruébalo en las peticiones de red); la elección se respeta y se puede cambiar.
- [ ] Textos "Pendiente de revisión legal" listados como ⚠️.

## 3. SEO y compartir
- [ ] Title y description únicos en cada página (lista con la longitud de cada uno).
- [ ] Open Graph con imagen 1200×630 en las páginas clave.
- [ ] Favicon completo y manifest válido.
- [ ] `sitemap.xml` con todas las páginas públicas y ninguna privada; `robots.txt` apunta al sitemap y no bloquea recursos necesarios.
- [ ] Canonical, un H1 por página y JSON-LD válido.
- [ ] La 404 personalizada responde con código 404 real y la página de error lleva la marca.
- [ ] Enlaces: `npx linkinator <url> --recurse --check-fragments` sin enlaces rotos; revisa a mano los `tel:`, `mailto:` y de WhatsApp.

## 4. Rendimiento
- [ ] Lighthouse en modo móvil sobre cada plantilla de página: registra las cuatro puntuaciones, LCP, CLS y TBT. Meta ≥ 90.
- [ ] Imágenes en formato moderno, con dimensiones correctas y sin archivos pesados injustificados; la imagen LCP con prioridad.
- [ ] Peso del JS del cliente revisado; elimina librerías que no se justifiquen.

## 5. Accesibilidad y móvil
- [ ] Lighthouse Accesibilidad sin fallas (`npx @axe-core/cli <url>` si necesitas más detalle).
- [ ] Contraste AA en texto y componentes; lista los pares de color corregidos.
- [ ] Alt en imágenes informativas y `alt=""` en decorativas.
- [ ] Recorrido completo con teclado: foco visible, orden lógico, sin trampas de foco y menú móvil accesible.
- [ ] A 360 px: sin scroll horizontal, texto legible, objetivos táctiles ≥ 44 px, campos de 16 px o más (evitan el zoom en iOS), altura con `dvh` en vez de `100vh` y teclado correcto en cada campo (`type`, `inputmode`, `autocomplete`).
- [ ] `prefers-reduced-motion` respetado.

## 6. Diseño, contenido y conversión
- [ ] `npx impeccable detect <url>` en escritorio y con `--viewport 390x844`: sin hallazgos principales o cada uno justificado. Si la skill Impeccable está instalada, después `/impeccable audit` y `/impeccable polish`.
- [ ] Un solo CTA principal por página, visible sin scroll en móvil, que lleva a donde promete.
- [ ] El evento de conversión del CTA llega a la analítica (vista de depuración o en tiempo real).
- [ ] Cero `[[PENDIENTE]]`, lorem ipsum, textos de plantilla o datos inventados.
- [ ] Formularios probados de punta a punta: el mensaje o lead llega. Si el sitio envía correos, el dominio tiene SPF, DKIM y DMARC.

## Reporte
Guárdalo en `docs/AUDITORIA.md` (lo usa `/entrega`): tabla por sección (punto · estado · evidencia · acción), correcciones hechas con su commit, lista de ⚠️ que requieren acción mía y puntuaciones finales de Lighthouse. En el chat, dame el resumen con el formato del reporte de fase y espera OK.
