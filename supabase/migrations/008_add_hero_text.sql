-- Cervezaverso — Textos del Hero en modo video.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 007_store_settings_hero.sql.
--
-- Los banners del carrusel viven en hero_banners (jsonb): su título y subtítulo opcionales
-- ("title" y "subtitle") no necesitan cambios de esquema.

alter table public.store_settings
  add column if not exists hero_video_title text
    check (hero_video_title is null or char_length(hero_video_title) <= 120),
  add column if not exists hero_video_subtitle text
    check (hero_video_subtitle is null or char_length(hero_video_subtitle) <= 240);

notify pgrst, 'reload schema';
