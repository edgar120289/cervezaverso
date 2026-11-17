-- Cervezaverso — Fase 1 del plan de fotos: portadas uniformes.
-- Solo agrega dos columnas opcionales a `products`; no modifica ni borra columnas ni datos.
-- Es idempotente. Reversa exacta: supabase/reversa/032_portadas_down.sql
--
-- portada_original: la `image_url` que tenía la cerveza antes de la portada nueva
--                   (NULL si no tenía foto). `npm run portadas -- --revertir` la regresa.
-- portada_estado:   'normalizada' (se procesó su foto), 'nueva' (no tenía o se buscó otra)
--                   o 'revisar' (falta una buena foto; se dejó como estaba).
--
-- Son internas del panel: no se les da SELECT a anon ni authenticated (regla de la 024).

alter table public.products
  add column if not exists portada_original text;

alter table public.products
  add column if not exists portada_estado text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_portada_estado_check') then
    alter table public.products
      add constraint products_portada_estado_check
      check (portada_estado is null or portada_estado in ('normalizada', 'nueva', 'revisar'));
  end if;
end $$;
