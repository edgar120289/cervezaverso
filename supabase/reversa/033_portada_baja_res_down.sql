-- Cervezaverso — Reversa de 033_portada_baja_res.sql.
-- ANTES de correrla, regresa las fotos: `cd tools/portadas && npm run portadas -- --revertir`
-- (deja `portada_estado` en NULL). Si aún hay cervezas en 'baja_res', se detiene sin cambiar nada.
-- Regresa la restricción a los valores de la 032. Es idempotente.

do $$
begin
  if exists (select 1 from public.products where portada_estado = 'baja_res') then
    raise exception 'Hay cervezas con portada_estado = ''baja_res''. Corre primero --revertir.';
  end if;
end $$;

alter table public.products
  drop constraint if exists products_portada_estado_check;

alter table public.products
  add constraint products_portada_estado_check
  check (portada_estado is null or portada_estado in ('normalizada', 'nueva', 'revisar'));
