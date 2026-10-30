-- 030 · Historias (24 h) en el publicador de redes. feed = publicación normal; historia = una imagen 9:16.
-- La función reclamar_publicacion_redes() devuelve la fila completa (p.*), así que ya incluye la columna nueva.
alter table public.redes_publicaciones add column if not exists formato text not null default 'feed'
  check (formato in ('feed', 'historia'));
