-- Cervezaverso — Foto de perfil, más Teams y ventas por mes (Resumen de /admin).
-- Ejecutar completo en el SQL Editor de Supabase (idempotente). Requiere 002 (public.is_admin()) y 011 (avatar_team).

-- 1. Foto de perfil -----------------------------------------------------------
alter table public.users add column if not exists avatar_url text;
grant update (avatar_url) on public.users to authenticated;

-- 2. Teams ampliados (de 6 a 12) ------------------------------------------------
alter table public.users drop constraint if exists users_avatar_team_check;
alter table public.users
  add constraint users_avatar_team_check
  check (avatar_team is null or avatar_team in (
    'ipa', 'stout', 'sour', 'lager', 'trigo', 'ale',
    'porter', 'barleywine', 'lambic', 'bitter', 'weissbier', 'bock'
  ));

-- 3. Bucket público "avatars" (2 MB, solo imágenes) ------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública; cada cliente escribe solo dentro de su carpeta (<user_id>/archivo).
drop policy if exists "avatars: lectura pública" on storage.objects;
create policy "avatars: lectura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: el dueño sube" on storage.objects;
create policy "avatars: el dueño sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: el dueño actualiza" on storage.objects;
create policy "avatars: el dueño actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: el dueño borra" on storage.objects;
create policy "avatars: el dueño borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Ventas de un periodo [p_desde, p_hasta) ---------------------------------------
-- Pedidos cobrados (Pagado, Enviado, Entregado). Sustituye en el Resumen a ventas_desde (015), que se conserva.
create or replace function public.ventas_periodo(p_desde timestamptz, p_hasta timestamptz)
returns table (ventas numeric, pedidos bigint)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso restringido a administradores' using errcode = '42501';
  end if;

  return query
    select coalesce(sum(p.total), 0)::numeric, count(*)::bigint
      from public.pedidos p
     where p.estado in ('Pagado', 'Enviado', 'Entregado')
       and p.fecha >= p_desde
       and p.fecha < p_hasta;
end;
$$;

revoke all on function public.ventas_periodo(timestamptz, timestamptz) from public, anon;
grant execute on function public.ventas_periodo(timestamptz, timestamptz) to authenticated, service_role;

notify pgrst, 'reload schema';
