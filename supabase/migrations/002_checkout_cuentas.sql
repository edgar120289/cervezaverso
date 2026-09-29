-- Cervezaverso — Checkout, cuentas de cliente y fidelización.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
--
-- 1. Corrige la recursión infinita de las políticas que consultaban `public.users`
--    desde la propia política de `public.users` (error 42P17).
-- 2. Otorga los privilegios de tabla que faltaban (error 42501 "permission denied").
-- 3. Amplía `pedidos` (cliente, envío, dirección, notas) y crea `pedido_items` y `direcciones`.

-- ─────────────────────────────────────────────────────────────
-- is_admin(): consulta el rol sin pasar por RLS (security definer),
-- así las políticas pueden usarla sin volver a evaluarse a sí mismas.
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- users
drop policy if exists "Los admins pueden ver todos los perfiles" on public.users;
create policy "Los admins pueden ver todos los perfiles"
  on public.users for select
  using (public.is_admin());

-- products
drop policy if exists "Sólo admins pueden modificar productos" on public.products;
create policy "Sólo admins pueden modificar productos"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- pedidos: datos de cliente, envío, dirección y notas
-- ─────────────────────────────────────────────────────────────
alter table public.pedidos
  add column if not exists user_id uuid references public.users (id) on delete set null,
  add column if not exists cliente_telefono text,
  add column if not exists metodo_envio text not null default 'nacional',
  add column if not exists subtotal numeric(10, 2) not null default 0,
  add column if not exists costo_envio numeric(10, 2) not null default 0,
  add column if not exists direccion jsonb,
  add column if not exists notas text;

alter table public.pedidos drop constraint if exists pedidos_metodo_envio_check;
alter table public.pedidos
  add constraint pedidos_metodo_envio_check check (metodo_envio in ('nacional', 'local'));

create index if not exists pedidos_user_fecha_idx on public.pedidos (user_id, fecha desc);

drop policy if exists "Los admins ven todos los pedidos" on public.pedidos;
create policy "Los admins ven todos los pedidos"
  on public.pedidos for select
  using (public.is_admin());

drop policy if exists "Los admins gestionan los pedidos" on public.pedidos;
create policy "Los admins gestionan los pedidos"
  on public.pedidos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Historial: cada cliente ve sus propios pedidos. Los pedidos se crean desde el
-- servidor (Server Action con service_role), nunca directamente desde el navegador.
drop policy if exists "Los clientes ven sus propios pedidos" on public.pedidos;
create policy "Los clientes ven sus propios pedidos"
  on public.pedidos for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- pedido_items: renglones del pedido (precio congelado al momento de la compra)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  sku text not null,
  nombre text not null,
  precio_unitario numeric(10, 2) not null,
  cantidad integer not null check (cantidad > 0),
  importe numeric(10, 2) not null
);

create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

alter table public.pedido_items enable row level security;

drop policy if exists "Los clientes ven los renglones de sus pedidos" on public.pedido_items;
create policy "Los clientes ven los renglones de sus pedidos"
  on public.pedido_items for select
  using (
    public.is_admin()
    or exists (select 1 from public.pedidos p where p.id = pedido_id and p.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- direcciones: libreta de envío para compras en 1 clic
-- ─────────────────────────────────────────────────────────────
create table if not exists public.direcciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nombre_completo text not null,
  telefono text not null,
  calle text not null,
  colonia text not null,
  ciudad text not null,
  estado text not null,
  codigo_postal text not null,
  referencias text,
  predeterminada boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists direcciones_user_idx on public.direcciones (user_id, created_at desc);
-- Sólo una dirección predeterminada por cliente.
create unique index if not exists direcciones_una_predeterminada
  on public.direcciones (user_id) where predeterminada;

alter table public.direcciones enable row level security;

drop policy if exists "Los clientes gestionan sus direcciones" on public.direcciones;
create policy "Los clientes gestionan sus direcciones"
  on public.direcciones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Privilegios de tabla (RLS decide qué filas; esto decide si el rol puede tocar la tabla).
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

grant select on public.products to anon, authenticated;
grant select on public.users to authenticated;
-- Sólo `full_name`: un cliente no puede ascenderse a admin editando su propio `role`.
revoke update on public.users from authenticated;
grant update (full_name) on public.users to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.pedidos, public.pedido_items to authenticated;
grant select, insert, update, delete on public.direcciones to authenticated;

grant all on public.users, public.products, public.favorites, public.pedidos,
  public.pedido_items, public.direcciones to service_role;

-- Perfiles de cuentas creadas antes de que existiera el trigger on_auth_user_created.
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;

notify pgrst, 'reload schema';
