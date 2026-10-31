-- 031 · Guía de envío del pedido: se captura en /admin/pedidos/[id] y va en el correo «Enviado».
alter table public.pedidos add column if not exists paqueteria text check (paqueteria is null or char_length(paqueteria) <= 60);
alter table public.pedidos add column if not exists guia text check (guia is null or char_length(guia) <= 80);
alter table public.pedidos add column if not exists guia_url text check (guia_url is null or guia_url ~ '^https://');
