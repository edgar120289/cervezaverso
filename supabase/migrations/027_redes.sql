-- 027 · Publicador de redes (Instagram y Facebook vía la API de Meta).
-- Cola de publicaciones que el admin aprueba en /admin/redes; /api/cron/publicar-redes publica las
-- aprobadas cuya hora ya llegó. pg_cron llama esa ruta cada 15 minutos (Vercel Hobby solo permite 1 al día).

create table if not exists public.redes_publicaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 120),
  caption text not null default '' check (char_length(caption) <= 2200),
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 10),
  redes text[] not null default '{instagram,facebook}'
    check (redes <@ array['instagram','facebook']::text[] and cardinality(redes) >= 1),
  programada_para timestamptz not null,
  estado text not null default 'borrador'
    check (estado in ('borrador','aprobada','publicando','publicada','error')),
  nota text,
  ig_media_id text,
  fb_post_id text,
  error text,
  intentos int not null default 0,
  publicada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists redes_publicaciones_pendientes_idx
  on public.redes_publicaciones (programada_para) where estado = 'aprobada';

alter table public.redes_publicaciones enable row level security;
revoke all on public.redes_publicaciones from anon;
grant select, insert, update, delete on public.redes_publicaciones to authenticated;

drop policy if exists "redes: solo admins" on public.redes_publicaciones;
create policy "redes: solo admins" on public.redes_publicaciones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Toma UNA publicación aprobada y vencida y la marca «publicando», para que dos llamadas al mismo
-- tiempo nunca publiquen la misma. Solo la usa el servidor (service role).
create or replace function public.reclamar_publicacion_redes()
returns setof public.redes_publicaciones
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Si una quedó atorada en «publicando» más de 30 min (la función se cortó), vuelve a la cola.
  update public.redes_publicaciones
     set estado = 'aprobada', updated_at = now()
   where estado = 'publicando' and updated_at < now() - interval '30 minutes' and intentos < 3;

  return query
  update public.redes_publicaciones p
     set estado = 'publicando', intentos = p.intentos + 1, updated_at = now()
   where p.id = (
     select id from public.redes_publicaciones
      where estado = 'aprobada' and programada_para <= now()
      order by programada_para
      limit 1
      for update skip locked
   )
  returning p.*;
end;
$$;

revoke execute on function public.reclamar_publicacion_redes() from public, anon, authenticated;
grant execute on function public.reclamar_publicacion_redes() to service_role;

-- Bucket público «redes»: Instagram descarga las imágenes por URL pública (JPG).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('redes', 'redes', true, 8388608, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg'];

drop policy if exists "redes: lectura pública" on storage.objects;
create policy "redes: lectura pública" on storage.objects
  for select using (bucket_id = 'redes');

drop policy if exists "redes: admins suben" on storage.objects;
create policy "redes: admins suben" on storage.objects
  for insert to authenticated with check (bucket_id = 'redes' and public.is_admin());

drop policy if exists "redes: admins borran" on storage.objects;
create policy "redes: admins borran" on storage.objects
  for delete to authenticated using (bucket_id = 'redes' and public.is_admin());

-- Cada 15 minutos, pg_cron pide a la tienda que publique lo que ya toca. La ruta es idempotente:
-- solo publica lo aprobado y vencido, así que una llamada de más no adelanta nada.
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.unschedule('publicar-redes') where exists (select 1 from cron.job where jobname = 'publicar-redes');
select cron.schedule(
  'publicar-redes',
  '*/15 * * * *',
  $$ select net.http_get(url := 'https://www.cervezaverso.com/api/cron/publicar-redes', timeout_milliseconds := 55000); $$
);
