-- Cervezaverso — Método de pago del pedido (Mercado Pago o transferencia interbancaria).
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente).
-- Un pedido por transferencia queda Pendiente hasta que el administrador lo marque Pagado.
alter table public.pedidos
  add column if not exists metodo_pago text not null default 'mercadopago';

alter table public.pedidos
  drop constraint if exists pedidos_metodo_pago_check;
alter table public.pedidos
  add constraint pedidos_metodo_pago_check check (metodo_pago in ('mercadopago', 'transferencia'));
