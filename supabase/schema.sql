-- Cervezaverso — Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en el SQL editor de Supabase o vía `supabase db push`.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- users: perfiles de clientes y administradores (RBAC)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Los usuarios pueden ver su propio perfil"
  on public.users for select
  using (auth.uid() = id);

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.users for update
  using (auth.uid() = id);

create policy "Los admins pueden ver todos los perfiles"
  on public.users for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- Crea automáticamente el perfil en public.users al registrarse en auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- products: catálogo de cervezas
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  brewery text,
  country text not null,
  style text not null,
  abv numeric(4, 2) not null default 0,
  volume_ml integer not null default 0,
  cost_price numeric(10, 2) not null default 0,
  sale_price numeric(10, 2) not null default 0,
  stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'preorder')),
  badges text[] not null default '{}',
  description_ai text,
  pairing_ai text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fichas del Sommelier Digital (MASTER PROMPT V2 · Bloque 2.1).
-- `pais` es un alias en español de `country` (columna generada: nunca se desincroniza).
alter table public.products
  add column if not exists notas_origen text,
  add column if not exists notas_perfil text,
  add column if not exists notas_maridaje text,
  add column if not exists pais text generated always as (country) stored;

alter table public.products enable row level security;

create policy "Cualquiera puede ver los productos"
  on public.products for select
  using (true);

create policy "Sólo admins pueden modificar productos"
  on public.products for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- favorites: wishlist del cliente
-- ─────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "Los clientes gestionan sus propios favoritos"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- pedidos: pedidos de la tienda (checkout y panel de administración)
-- ─────────────────────────────────────────────────────────────
-- Reemplaza a la antigua tabla `orders`.
drop table if exists public.orders;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_nombre text not null,
  cliente_email text not null,
  fecha timestamptz not null default now(),
  total numeric(10, 2) not null default 0,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'))
);

create index if not exists pedidos_estado_fecha_idx on public.pedidos (estado, fecha desc);

alter table public.pedidos enable row level security;

create policy "Los admins ven todos los pedidos"
  on public.pedidos for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Los admins gestionan los pedidos"
  on public.pedidos for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
