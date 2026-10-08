-- Mercado Pago: referencias de la preferencia y del pago aprobado en cada pedido.
-- `mp_payment_id` es único: un mismo pago no puede acreditarse en dos pedidos.
alter table public.pedidos
  add column if not exists mp_preference_id text,
  add column if not exists mp_payment_id text;

create unique index if not exists pedidos_mp_payment_id_key
  on public.pedidos (mp_payment_id)
  where mp_payment_id is not null;
