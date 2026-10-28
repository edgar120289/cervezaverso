-- Cervezaverso — Seguridad: endurecer permisos de la base (crítico 6 de la auditoría).
-- Ejecutar completo en el SQL Editor de Supabase. Es idempotente y no cambia el cuerpo de ninguna
-- función ni la lógica de RLS. Se puede correr antes o después de desplegar: el código no la usa.
--
-- 1. search_path fijo en las funciones que el asesor de Supabase marca sin él.
-- 2. EXECUTE revocado a anon, authenticated y public en dos funciones que solo disparan triggers.
-- 3. TRUNCATE, REFERENCES, TRIGGER (y MAINTAIN, de PostgreSQL 17) revocados a anon y authenticated.
-- 4. Privilegios por defecto para que las tablas nuevas no los reciban.
-- 5. Comprobación final: si queda alguno, la migración falla y se deshace.

-- ─────────────────────────────────────────────────────────────
-- 1. search_path fijo (mismo valor que ya usan el resto de las funciones de public).
-- ─────────────────────────────────────────────────────────────
alter function public.set_updated_at() set search_path = public;
alter function public.sync_product_cover_image() set search_path = public;
alter function public.touch_store_settings() set search_path = public;
alter function public.hero_ctas_valid(jsonb) set search_path = public;
alter function public.hero_banners_valid(jsonb) set search_path = public;

-- ─────────────────────────────────────────────────────────────
-- 2. EXECUTE de funciones que no son una API.
--
-- handle_new_user() (trigger de auth.users) y rls_auto_enable() (event trigger) solo las dispara
-- Postgres. Para ejecutar un trigger no se revisa EXECUTE al dispararlo (solo al crearlo), así que
-- revocarlo no afecta el alta de usuarios. Hoy anon y authenticated las podían invocar como
-- /rest/v1/rpc/…; Supabase los otorga a cada rol por separado, por eso se revoca rol por rol.
--
-- is_admin() NO se revoca a anon. Decisión: la usan las políticas RLS de products
-- («is_active OR is_admin()», rol public), así que el catálogo público la evalúa como anon y, sin
-- EXECUTE, la consulta fallaría con «permission denied for function is_admin». Tampoco se revoca a
-- authenticated (la usan todas las políticas de admin). Riesgo residual bajo: solo devuelve un
-- booleano sobre la propia sesión (auth.uid()), sin datos ni efectos.
-- ─────────────────────────────────────────────────────────────
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Privilegios de tabla que ningún flujo usa. TRUNCATE no pasa por RLS. SELECT, INSERT, UPDATE
-- y DELETE no se tocan: la seguridad de filas la da RLS y las columnas de products, la 024.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  tabla record;
  privilegios text := 'truncate, references, trigger';
begin
  if current_setting('server_version_num')::int >= 170000 then
    privilegios := privilegios || ', maintain';
  end if;

  for tabla in
    select schemaname, tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke %s on table %I.%I from anon, authenticated', privilegios, tabla.schemaname, tabla.tablename);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Privilegios por defecto: las tablas que cree `postgres` (el rol del SQL Editor y de las
-- migraciones) en public ya no los otorgan a anon ni authenticated. Las que cree supabase_admin
-- (Supabase internamente) no se pueden cambiar desde el SQL Editor: ahí solo se avisa.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  privilegios text := 'truncate, references, trigger';
  duenio text;
begin
  if current_setting('server_version_num')::int >= 170000 then
    privilegios := privilegios || ', maintain';
  end if;

  foreach duenio in array array['postgres', 'supabase_admin'] loop
    begin
      execute format('alter default privileges for role %I in schema public revoke %s on tables from anon, authenticated', duenio, privilegios);
    exception when insufficient_privilege then
      raise notice 'Sin permiso para cambiar los privilegios por defecto de %: se omite.', duenio;
    end;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Comprobación: falla si algún rol público conserva TRUNCATE, REFERENCES o TRIGGER en una
-- tabla de public, o EXECUTE en las dos funciones de trigger.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  restos text;
begin
  select string_agg(format('%s en %s para %s', priv, c.relname, r.rolname), '; ')
  into restos
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join pg_roles r
  cross join unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER']) as priv
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and r.rolname in ('anon', 'authenticated')
    and has_table_privilege(r.oid, c.oid, priv);
  if restos is not null then
    raise exception 'Quedan privilegios de tabla para anon o authenticated: %', restos;
  end if;

  if has_function_privilege('anon', 'public.handle_new_user()', 'execute')
     or has_function_privilege('authenticated', 'public.handle_new_user()', 'execute')
     or has_function_privilege('anon', 'public.rls_auto_enable()', 'execute')
     or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute') then
    raise exception 'handle_new_user o rls_auto_enable siguen siendo ejecutables por anon o authenticated.';
  end if;
end $$;
