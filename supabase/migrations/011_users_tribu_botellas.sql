-- Cervezaverso — Tribu cervecera y contador de botellas del cliente.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
--
-- Los perfiles viven en `public.users` (no existe `profiles`). Los favoritos ya existen en
-- `public.favorites` (schema.sql), así que no se crea `user_favorites`.
-- El cliente solo puede cambiar su `avatar_team`; `bottle_count` lo escribe el servidor
-- (el privilegio de columna `update (full_name)` de 002 no lo incluye).

alter table public.users
  add column if not exists avatar_team text,
  add column if not exists bottle_count integer not null default 0;

alter table public.users drop constraint if exists users_avatar_team_check;
alter table public.users
  add constraint users_avatar_team_check
  check (avatar_team is null or avatar_team in ('ipa', 'stout', 'sour', 'lager', 'trigo', 'ale'));

alter table public.users drop constraint if exists users_bottle_count_check;
alter table public.users add constraint users_bottle_count_check check (bottle_count >= 0);

grant update (avatar_team) on public.users to authenticated;

notify pgrst, 'reload schema';
