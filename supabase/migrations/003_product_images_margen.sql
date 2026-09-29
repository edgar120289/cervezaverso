-- Cervezaverso — Imágenes de producto (Storage) y margen de utilidad por producto.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 002_checkout_cuentas.sql (usa public.is_admin()).

-- ─────────────────────────────────────────────────────────────
-- products.margin_pct: margen de utilidad personalizado (por defecto 50%).
-- sale_price = floor(cost_price * (1 + margin_pct / 100) / 5) * 5
-- ─────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists margin_pct numeric(5, 2) not null default 50;

alter table public.products drop constraint if exists products_margin_pct_check;
alter table public.products
  add constraint products_margin_pct_check check (margin_pct >= 0 and margin_pct <= 500);

-- Los admins editan productos desde el panel con su propia sesión (RLS: is_admin()).
grant insert, update on public.products to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Bucket público "product-images"
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública (el bucket es público; esta política cubre también list/select vía API).
drop policy if exists "product-images: lectura pública" on storage.objects;
create policy "product-images: lectura pública"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Sólo admins suben, reemplazan y borran imágenes.
drop policy if exists "product-images: admins suben" on storage.objects;
create policy "product-images: admins suben"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: admins actualizan" on storage.objects;
create policy "product-images: admins actualizan"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: admins borran" on storage.objects;
create policy "product-images: admins borran"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

notify pgrst, 'reload schema';
