-- Cervezaverso — Descuento por volumen (10% en compras mayores a $6,000 en productos).
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente). NO se ha ejecutado.
-- Se guarda aparte de `descuento` (códigos de promoción): total = subtotal - descuento - descuento_volumen + costo_envio.
alter table public.pedidos
  add column if not exists descuento_volumen numeric(10, 2) not null default 0;
