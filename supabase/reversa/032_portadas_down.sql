-- Cervezaverso — Reversa de 032_portadas.sql (Fase 1 del plan de fotos).
-- ANTES de correrla, regresa las fotos: `npm run portadas -- --revertir`
-- (usa `portada_original`; si borras primero la columna, se pierde el dato para regresar,
-- aunque sigue el respaldo en respaldos/portadas_antes_fase1.json).
--
-- Elimina exactamente lo que agregó la 032: `portada_original` y `portada_estado`
-- (la restricción `products_portada_estado_check` se va junto con su columna).
-- No toca ninguna otra columna ni dato, ni archivos de Storage. Es idempotente.
-- Ejecutar completo en el SQL Editor de Supabase.

alter table public.products
  drop column if exists portada_estado;

alter table public.products
  drop column if exists portada_original;
