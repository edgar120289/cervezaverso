-- Cervezaverso — Configuración modular de la Landing Page y productos destacados.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 007_store_settings_hero.sql.
--
-- landing_settings (jsonb) guarda el Hero y los bloques modulares de la landing sin cambiar
-- el esquema cada vez; su forma se valida en la aplicación con zod. Las políticas RLS de
-- store_settings (lectura pública, escritura admin) aplican también a la columna nueva.
-- is_featured marca los productos destacados; las políticas RLS de products no cambian.

alter table public.store_settings
  add column if not exists landing_settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(landing_settings) = 'object');

alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists products_is_featured_idx
  on public.products (is_featured)
  where is_featured;

notify pgrst, 'reload schema';
