-- Cervezaverso — Productos activos/inactivos y galería de imágenes.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 002_checkout_cuentas.sql (usa public.is_admin()) y 003_product_images_margen.sql.

-- ─────────────────────────────────────────────────────────────
-- 1. products.is_active: ocultar una cerveza sin borrar sus datos
-- ─────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists is_active boolean not null default true;

-- El público (anon) y los clientes sólo ven productos activos; los admins ven todos.
-- Así un producto inactivo desaparece del catálogo, la ficha, el sitemap y el
-- checkout sin tocar el código de la tienda. La service role (importación) no pasa por RLS.
drop policy if exists "Cualquiera puede ver los productos" on public.products;
drop policy if exists "Ver productos activos (admins ven todos)" on public.products;
create policy "Ver productos activos (admins ven todos)"
  on public.products for select
  using (is_active or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 2. products.image_urls: galería ordenada (la primera es la portada)
-- ─────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists image_urls text[] not null default '{}';

alter table public.products drop constraint if exists products_image_urls_max_check;
alter table public.products
  add constraint products_image_urls_max_check check (cardinality(image_urls) <= 10);

-- Migra la imagen única existente a la galería (sólo donde la galería aún está vacía).
update public.products
   set image_urls = array[image_url]
 where image_url is not null
   and image_url <> ''
   and cardinality(image_urls) = 0;

-- `image_url` se conserva como portada (la usan carrito, catálogo y Open Graph):
-- un trigger la mantiene igual a la primera imagen de la galería.
create or replace function public.sync_product_cover_image()
returns trigger language plpgsql as $$
begin
  new.image_url := new.image_urls[1];
  return new;
end;
$$;

drop trigger if exists sync_products_cover_image on public.products;
create trigger sync_products_cover_image
  before insert or update of image_urls on public.products
  for each row execute function public.sync_product_cover_image();
