-- Cervezaverso — Fase 0 del plan de fotos: vaso en que se sirve cada cerveza.
-- Solo agrega dos columnas opcionales a `products`; no modifica ni borra columnas ni datos.
-- Es idempotente. Reversa exacta: supabase/reversa/027_vasos_down.sql
--
-- vaso:        código del vaso (catálogo en lib/vasos.ts). NULL = sin asignar.
-- vaso_origen: 'auto' (lo asignó la regla) o 'manual' (lo cambió el admin en /admin/vasos).
--
-- Las dos columnas son internas del panel: no se les da SELECT a anon ni authenticated
-- (migración 024), así que solo las lee el service role tras validar al administrador.

alter table public.products
  add column if not exists vaso text;

alter table public.products
  add column if not exists vaso_origen text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_vaso_origen_check') then
    alter table public.products
      add constraint products_vaso_origen_check check (vaso_origen is null or vaso_origen in ('auto', 'manual'));
  end if;
end $$;
