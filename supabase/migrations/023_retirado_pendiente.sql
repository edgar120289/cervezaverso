-- Cervezaverso — Carga masiva v2: cervezas retiradas, nuevas pendientes y proveedor.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente). Solo agrega columnas.
--
-- retirado:  el admin la sacó del catálogo a propósito. La carga masiva nunca la vuelve
--            a activar ni le cambia precio o datos (aunque el proveedor la liste disponible).
-- pendiente: entró por carga masiva y espera foto, cervecería y notas. Queda inactiva hasta
--            que el admin la active; la carga masiva no la activa.
-- proveedor: 'monasterio' cuando la última carga del archivo de Monasterio la incluyó. Sirve
--            para marcar como agotadas las que dejan de venir en la lista sin tocar las que
--            se dieron de alta a mano.

alter table public.products
  add column if not exists retirado boolean not null default false;

alter table public.products
  add column if not exists pendiente boolean not null default false;

alter table public.products
  add column if not exists proveedor text;

-- Respaldo de lo que ya se retiró a mano: inactivas que siguen con existencia
-- (la carga masiva solo desactiva lo que viene «agotado»).
update public.products
set retirado = true
where retirado = false
  and is_active = false
  and stock_status in ('in_stock', 'low_stock');
