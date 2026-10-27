-- Cervezaverso — Código de barras (GTIN) por producto, para el feed de Google Merchant Center.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente). NO se ha ejecutado.
-- IMPORTANTE: correrla ANTES de desplegar el código que lee la columna; si el sitio se publica primero,
-- la consulta del catálogo falla porque `products.gtin` aún no existe.
-- Nulo = el producto no tiene código de barras (cervezas artesanales); el feed lo marca con identifier_exists = no.
-- Acepta GTIN-8, UPC-A (12), EAN-13 y GTIN-14: solo dígitos. El dígito verificador lo valida la aplicación.
alter table public.products
  add column if not exists gtin text;

alter table public.products
  drop constraint if exists products_gtin_format_check;

alter table public.products
  add constraint products_gtin_format_check
  check (gtin is null or gtin ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$');
