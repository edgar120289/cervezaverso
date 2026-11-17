-- Cervezaverso — Reversa de 027_vasos.sql (Fase 0 del plan de fotos).
-- Elimina exactamente lo que agregó la 027: las columnas `vaso` y `vaso_origen` de `products`
-- (la restricción `products_vaso_origen_check` se va junto con su columna).
-- No toca ninguna otra columna ni dato. Es idempotente.
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Ojo: se pierden las asignaciones de vaso (también las hechas a mano). Las automáticas se
-- pueden regenerar con `npm run vasos -- --apply` después de volver a correr la 027.

alter table public.products
  drop column if exists vaso_origen;

alter table public.products
  drop column if exists vaso;
