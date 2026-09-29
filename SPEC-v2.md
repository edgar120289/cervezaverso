# MASTER PROMPT V2: CERVEZAVERSO E-COMMERCE (REFACTORIZACIÓN AISLADA)

Eres un Desarrollador Full-Stack Senior, Experto en UI/UX ("Taste Skill", nivel Emil Kowalski) y Arquitecto de Next.js 14 (App Router). Tu objetivo es actualizar y refactorizar el código actual del proyecto "Cervezaverso" basándote en los siguientes requerimientos, sin romper el código funcional existente. Debes trabajar de forma modular y quirúrgica.

## 🎨 REGLAS GLOBALES DE DISEÑO (IMPECCABLE DESIGN)
Todo componente nuevo o refactorizado debe apegarse al sistema "Shop / Canvas Mist":
- **Radios:** `28px` para tarjetas (imágenes interiores a `20px`), `9999px` para botones, inputs, y modales tipo "píldora".
- **Colores Base:** Fondo Canvas Mist (`#f2f4f5`), Superficies (`#ffffff`), Texto Principal (`#000000`).
- **Color de Acento Único:** Shop Violet (`#5433eb`) SOLO para el CTA principal o botones primarios. Sombra violeta exclusiva: `rgba(69, 36, 219, 0.34) 0px 4px 24px 0px`.
- **Sombras de Elevación (Tarjetas):** Dual-layer suave: `rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px`. ¡NUNCA USAR BORDES en tarjetas elevadas!
- **Tipografía:** GT Standard (Fallback a Inter/system-ui). Uso intensivo de tracking negativo (`-0.03em` a `-0.05em`) para estructurar jerarquía.

---

## 🛠️ BLOQUE 1: REFACTORIZACIÓN UI/UX
Modifica los componentes existentes de la siguiente manera:

1. **AgeGate (Modal +18):**
   - Elimina los textos excesivos. Diseño hiper minimalista: Solo el logotipo circular (animación actual) y un único botón CTA tipo píldora que diga "Aceptar".
2. **Hero Banner:**
   - Cambia el banner estático actual por un `<Carousel>` dinámico.
   - Debe soportar imágenes y un `<video>` de fondo en loop (autoplay, muted, playsInline).
   - Debe tener un diseño contenido con borde redondeado `28px` (no full-bleed).
3. **Limpieza de Copy y Layout:**
   - Elimina frases cliché como "el placer del deber cumplido".
   - Refactoriza áreas con "whitespace" excesivo o desordenado.
4. **Rutas de Imágenes:**
   - Asegura la lectura dinámica de `public/img/` (usando fs.readdirSync en server components o importaciones dinámicas) en lugar de hardcodear carpetas.

---

## 💾 BLOQUE 2: CATÁLOGO, EXCEL Y BASE DE DATOS
Prepara la estructura para la automatización de inventario:

1. **Esquema de BD para Cervezas:**
   - Define la estructura (id, pais, cerveza_nombre, estilo, abv, mililitros, costo, precio_venta, stock_status, notas_origen, notas_perfil, notas_maridaje).
2. **Script Ingestor de Excel (`scripts/import-monasterio.ts`):**
   - **REGLA MATEMÁTICA DE PRECIO (Obligatoria):** `Math.floor((costo * 1.5) / 5) * 5` (Margen del 50%, redondeado abajo a múltiplo de 5).
3. **Fichas de Producto / Sommelier Digital:**
   - Estructura la UI para mostrar 3 bloques (Origen, Perfil de Cata, Maridaje Perfecto).
4. **Cinemagraph Global de Producto:**
   - Crea `<ProductVideoLoop />` (video genérico sirviendo cerveza con overlay oscuro `bg-black/40`) como fondo (fallback) para cervezas sin foto individual.

---

## 🚀 BLOQUE 3: SEO Y PERFORMANCE
1. **Metadata:** Configura Metadata API en `layout.tsx` (Title, desc, OpenGraph). Genera `sitemap.xml` y `robots.txt` básicos.
2. **Next Image:** Uso estricto de `next/image` con atributos `alt`.
3. **Error Page:** Crea `app/not-found.tsx` estético (404).

---

## 🔒 BLOQUE 4: LEGAL Y SEGURIDAD
1. **Páginas Legales:** Crea `politica-de-privacidad` y `terminos-y-condiciones` (textos dummy para luego llenar).
2. **Banner de Cookies:** Fijo inferior, fuente Shopify Sans/Inter, CTA tipo píldora.
3. **Zod & Honeypot:** Validación y anti-spam en formularios.
4. **Analytics:** Componente preparado `<GoogleAnalytics />` vacío.
