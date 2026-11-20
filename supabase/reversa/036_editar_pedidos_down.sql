-- Reversa de 036 · borra tablas y funciones de edición de pedidos (se pierden pagos, notas internas y bitácora).
-- Antes de correrla: si #7E31ABC4 debe conservar su nota, cópiala de pedido_notas_internas a pedidos.notas.
drop function if exists public.editar_pedido(uuid, jsonb, numeric, text, text, text);
drop function if exists public.sincronizar_botellas_pedido(uuid);
drop table if exists public.pedido_bitacora;
drop table if exists public.pedido_notas_internas;
drop table if exists public.pedido_pagos;
alter table public.pedido_items drop column if exists agregado;
