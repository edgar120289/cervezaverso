# Cervezaverso

Tienda en línea de cerveza artesanal nacional e importada. Next.js (App
Router) + TypeScript + Tailwind v4 + Framer Motion + Supabase.

## Empezar

```bash
npm install
cp .env.example .env.local   # completa tus llaves de Supabase / Gemini
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Base de datos

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Corre `supabase/schema.sql` en el SQL editor del proyecto (tablas
   `users`, `products`, `pedidos`, `favorites` con RLS).
3. Copia la URL y las llaves (`anon` y `service_role`) a `.env.local`.
4. Para crear el primer admin: registra una cuenta desde `/login` y luego
   actualiza manualmente su fila en `public.users` con
   `role = 'admin'`.

## Importar catálogo desde Excel

Como administrador, entra a `/admin/import` y sube el archivo `.xlsx`
con la pestaña **LISTA MONASTERIO**. El precio de venta se calcula
automáticamente con la fórmula obligatoria del SPEC:
`Math.floor((cost_price * 1.5) / 5) * 5`.

## Enriquecimiento con IA

`POST /api/ai/enrich` con `{ product_id }` genera `description_ai` y
`pairing_ai` vía Gemini (requiere `GEMINI_API_KEY`).

## Assets pendientes

- `public/multiverso/jar-*.svg` son placeholders del logo dinámico;
  reemplázalos con los tarros reales del multiverso.
- `public/video/hero-broll.mp4` y `public/video/sommelier-broll.mp4` no
  existen aún: agrega los videos B-roll reales (el sitio funciona sin
  ellos, mostrando el fondo oscuro de respaldo).
- Pagos: preparado para Stripe / Mercado Pago en modo sandbox; falta
  conectar las llaves y el flujo real de cobro en `/carrito`.
