-- Cervezaverso — Portadas: estado 'baja_res' (foto original de 350–599 px escalada a 1200x1200
-- con lanczos y enfoque suave). Solo amplía los valores permitidos de `products.portada_estado`;
-- no cambia ningún dato. Es idempotente. Reversa: supabase/reversa/033_portada_baja_res_down.sql

alter table public.products
  drop constraint if exists products_portada_estado_check;

alter table public.products
  add constraint products_portada_estado_check
  check (portada_estado is null or portada_estado in ('normalizada', 'nueva', 'baja_res', 'revisar'));
