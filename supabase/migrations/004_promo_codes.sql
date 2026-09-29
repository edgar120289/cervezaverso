-- Cervezaverso — Cupones de descuento y tarjetas de regalo.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 002_checkout_cuentas.sql (usa public.is_admin()).

-- ─────────────────────────────────────────────────────────────
-- promo_codes
--   percent → value = % de descuento sobre el subtotal (1–100)
--   fixed   → value = monto en MXN (tarjeta de regalo o cupón de monto fijo)
--   max_uses: null = ilimitado; 1 = tarjeta de regalo de un solo uso.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,30}$'),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_purchase numeric(10, 2) not null default 0 check (min_purchase >= 0),
  active boolean not null default true,
  max_uses integer check (max_uses is null or max_uses > 0),
  times_used integer not null default 0 check (times_used >= 0),
  created_at timestamptz not null default now(),
  constraint promo_codes_percent_max check (discount_type <> 'percent' or value <= 100)
);

create index if not exists promo_codes_created_idx on public.promo_codes (created_at desc);

alter table public.promo_codes enable row level security;

-- Sólo admins leen y gestionan cupones. Los clientes validan su código a través
-- del servidor (service_role), así la lista de códigos nunca se expone.
drop policy if exists "Los admins gestionan los cupones" on public.promo_codes;
create policy "Los admins gestionan los cupones"
  on public.promo_codes for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;

-- ─────────────────────────────────────────────────────────────
-- Canje atómico: suma un uso sólo si el cupón sigue activo y con usos
-- disponibles. Si dos clientes canjean la última tarjeta a la vez, sólo uno gana.
-- ─────────────────────────────────────────────────────────────
create or replace function public.redeem_promo_code(p_code text)
returns setof public.promo_codes
language sql
security definer set search_path = public
as $$
  update public.promo_codes
     set times_used = times_used + 1
   where code = upper(trim(p_code))
     and active
     and (max_uses is null or times_used < max_uses)
  returning *;
$$;

-- Devuelve el uso si el pedido no se pudo registrar.
create or replace function public.release_promo_code(p_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.promo_codes set times_used = greatest(times_used - 1, 0) where id = p_id;
$$;

revoke all on function public.redeem_promo_code(text) from public, anon, authenticated;
revoke all on function public.release_promo_code(uuid) from public, anon, authenticated;
grant execute on function public.redeem_promo_code(text) to service_role;
grant execute on function public.release_promo_code(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────
-- pedidos: código aplicado y monto descontado
-- ─────────────────────────────────────────────────────────────
alter table public.pedidos
  add column if not exists promo_code text,
  add column if not exists descuento numeric(10, 2) not null default 0;

-- Cupones de ejemplo (se pueden desactivar desde /admin/cupones).
insert into public.promo_codes (code, discount_type, value, min_purchase, max_uses)
values
  ('DESCUENTO10', 'percent', 10, 0, null),
  ('REGALO500', 'fixed', 500, 0, 1)
on conflict (code) do nothing;

notify pgrst, 'reload schema';
