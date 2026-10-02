-- Cervezaverso — Configuración de la tienda: administrador del Hero.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 002_checkout_cuentas.sql (usa public.is_admin()).

-- ─────────────────────────────────────────────────────────────
-- 1. Validadores de los campos jsonb (CTAs y banners)
-- ─────────────────────────────────────────────────────────────
-- Un CTA es { "text": "...", "url": "...", "is_external": true|false }.
-- Internos: ruta que empieza con "/" (no "//"). Externos: http:// o https://.
-- Así nunca se guarda un "javascript:" ni un enlace relativo ambiguo.
create or replace function public.hero_ctas_valid(ctas jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  cta jsonb;
begin
  if jsonb_typeof(ctas) is distinct from 'array' or jsonb_array_length(ctas) > 3 then
    return false;
  end if;

  for cta in select * from jsonb_array_elements(ctas) loop
    if jsonb_typeof(cta) is distinct from 'object'
       or jsonb_typeof(cta -> 'text') is distinct from 'string'
       or jsonb_typeof(cta -> 'url') is distinct from 'string'
       or jsonb_typeof(cta -> 'is_external') is distinct from 'boolean'
       or char_length(btrim(cta ->> 'text')) not between 1 and 40
       or char_length(cta ->> 'url') not between 1 and 500 then
      return false;
    end if;

    if (cta ->> 'is_external')::boolean then
      if (cta ->> 'url') !~* '^https?://\S+$' then return false; end if;
    else
      if (cta ->> 'url') !~ '^/(?!/)\S*$' then return false; end if;
    end if;
  end loop;

  return true;
end;
$$;

-- Un banner es { "image_url": "...", "alt": "...", "ctas": [ <CTA>, ... ] }; máximo 10 banners.
create or replace function public.hero_banners_valid(banners jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  banner jsonb;
begin
  if jsonb_typeof(banners) is distinct from 'array' or jsonb_array_length(banners) > 10 then
    return false;
  end if;

  for banner in select * from jsonb_array_elements(banners) loop
    if jsonb_typeof(banner) is distinct from 'object'
       or jsonb_typeof(banner -> 'image_url') is distinct from 'string'
       or (banner ->> 'image_url') !~* '^https?://\S+$'
       or (banner ? 'alt' and (jsonb_typeof(banner -> 'alt') is distinct from 'string' or char_length(banner ->> 'alt') > 200))
       or not public.hero_ctas_valid(coalesce(banner -> 'ctas', '[]'::jsonb)) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Tabla store_settings (una sola fila: id = 1)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),

  -- Interruptor general: apagado, la tienda no muestra Hero.
  is_hero_active boolean not null default true,
  -- 'video' o 'carousel'.
  hero_type text not null default 'video' check (hero_type in ('video', 'carousel')),

  -- Modo video. Sin URL, la tienda usa el video por defecto de /public.
  hero_video_url text check (hero_video_url is null or hero_video_url ~* '^(https?://|/)\S+$'),
  -- Pausa el video cuando sale de pantalla (ahorra batería y CPU).
  hero_video_autopause boolean not null default true,
  -- CTAs del video: de 0 a 3.
  hero_video_ctas jsonb not null default '[]'::jsonb check (public.hero_ctas_valid(hero_video_ctas)),

  -- Modo carrusel: banners ordenados (cada uno con sus CTAs) y segundos entre cambios.
  hero_banners jsonb not null default '[]'::jsonb check (public.hero_banners_valid(hero_banners)),
  hero_carousel_interval_seconds smallint not null default 5 check (hero_carousel_interval_seconds in (3, 5, 7)),

  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create or replace function public.touch_store_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_store_settings on public.store_settings;
create trigger touch_store_settings
  before update on public.store_settings
  for each row execute function public.touch_store_settings();

-- ─────────────────────────────────────────────────────────────
-- 3. RLS: lectura pública; sólo admins modifican
-- ─────────────────────────────────────────────────────────────
alter table public.store_settings enable row level security;

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

drop policy if exists "Cualquiera puede ver la configuración" on public.store_settings;
create policy "Cualquiera puede ver la configuración"
  on public.store_settings for select
  using (true);

drop policy if exists "Admins actualizan la configuración" on public.store_settings;
create policy "Admins actualizan la configuración"
  on public.store_settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. Bucket público "hero-banners" (banners panorámicos 1920×1080)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero-banners',
  'hero-banners',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hero-banners: lectura pública" on storage.objects;
create policy "hero-banners: lectura pública"
  on storage.objects for select
  using (bucket_id = 'hero-banners');

drop policy if exists "hero-banners: admins suben" on storage.objects;
create policy "hero-banners: admins suben"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hero-banners' and public.is_admin());

drop policy if exists "hero-banners: admins actualizan" on storage.objects;
create policy "hero-banners: admins actualizan"
  on storage.objects for update to authenticated
  using (bucket_id = 'hero-banners' and public.is_admin())
  with check (bucket_id = 'hero-banners' and public.is_admin());

drop policy if exists "hero-banners: admins borran" on storage.objects;
create policy "hero-banners: admins borran"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hero-banners' and public.is_admin());

notify pgrst, 'reload schema';
