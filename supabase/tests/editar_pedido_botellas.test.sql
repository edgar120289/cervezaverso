-- Prueba · edición de pedidos (036): botellas sin duplicar en pedidos.botellas_acreditadas y users.bottle_count.
-- Transacción con ROLLBACK: no deja datos. Resultado esperado: una fila «OK».
begin;

do $$
declare
  u uuid := gen_random_uuid();
  p uuid := gen_random_uuid();
  it uuid;
  r jsonb;
  v_items jsonb;
  v_pago uuid;
  v_count integer;
  v_ped integer;
  v_premios integer;
begin
  insert into auth.users (id, email, email_confirmed_at) values (u, 'prueba-edicion-' || substr(u::text, 1, 8) || '@example.com', now());
  update public.users set bottle_count = 10 where id = u;  -- 10 de pedidos anteriores (simulados)
  insert into public.pedidos (id, cliente_nombre, cliente_email, estado, user_id, subtotal, costo_envio, total)
  values (p, 'Prueba', 'prueba@example.com', 'Pagado', u, 400, 150, 550);
  insert into public.pedido_items (id, pedido_id, sku, nombre, precio_unitario, cantidad, importe)
  values (gen_random_uuid(), p, 'prueba-a', 'Prueba A', 50, 8, 400) returning id into it;
  perform public.acreditar_botellas(p);  -- 10 + 8 = 18
  select bottle_count into v_count from public.users where id = u;
  if v_count <> 18 then raise exception 'PRUEBA FALLÓ: acreditación inicial %', v_count; end if;

  -- 1) Agregar 4 piezas con pago adicional pendiente: no suma todavía.
  insert into public.pedido_pagos (pedido_id, metodo, monto, estado, es_original) values (p, 'mercadopago', 550, 'recibido', true);
  insert into public.pedido_pagos (pedido_id, metodo, monto, estado) values (p, 'transferencia', 200, 'pendiente') returning id into v_pago;
  v_items := jsonb_build_array(
    jsonb_build_object('id', it, 'product_id', null, 'sku', 'prueba-a', 'nombre', 'Prueba A', 'precio_unitario', 50, 'cantidad', 8),
    jsonb_build_object('product_id', null, 'sku', 'prueba-b', 'nombre', 'Prueba B', 'precio_unitario', 50, 'cantidad', 4));
  r := public.editar_pedido(p, v_items, 150, 'Nota del cliente', 'prueba', 'agregó 4');
  if (r ->> 'total')::numeric <> 750 then raise exception 'PRUEBA FALLÓ: total %', r; end if;
  select bottle_count into v_count from public.users where id = u;
  select botellas_acreditadas into v_ped from public.pedidos where id = p;
  if v_count <> 18 or v_ped <> 8 then raise exception 'PRUEBA FALLÓ: con pago pendiente sumó (% / %)', v_count, v_ped; end if;
  if not exists (select 1 from public.pedido_items where pedido_id = p and sku = 'prueba-b' and agregado) then raise exception 'PRUEBA FALLÓ: no marcó agregado'; end if;

  -- 2) Pago recibido: suma la diferencia (4) y cruza el nivel 20 → un premio.
  update public.pedido_pagos set estado = 'recibido', recibido_at = now() where id = v_pago;
  r := public.sincronizar_botellas_pedido(p);
  select bottle_count into v_count from public.users where id = u;
  select botellas_acreditadas into v_ped from public.pedidos where id = p;
  select count(*) into v_premios from public.promo_codes where user_id = u and reward_level = 20 and active;
  if v_count <> 22 or v_ped <> 12 or v_premios <> 1 then raise exception 'PRUEBA FALLÓ: tras recibir (% / % / premios %)', v_count, v_ped, v_premios; end if;

  -- 3) Repetir no duplica.
  r := public.sincronizar_botellas_pedido(p);
  select bottle_count into v_count from public.users where id = u;
  if v_count <> 22 or r ->> 'status' <> 'sin_cambio' then raise exception 'PRUEBA FALLÓ: repetir sumó (%)', r; end if;

  -- 4) Quitar el renglón agregado: resta 4 y desactiva el premio de 20 sin canjear.
  r := public.editar_pedido(p, jsonb_build_array(
    jsonb_build_object('id', it, 'product_id', null, 'sku', 'prueba-a', 'nombre', 'Prueba A', 'precio_unitario', 50, 'cantidad', 8)), 150, null, 'prueba', 'quitó 4');
  select bottle_count into v_count from public.users where id = u;
  select botellas_acreditadas into v_ped from public.pedidos where id = p;
  select count(*) into v_premios from public.promo_codes where user_id = u and reward_level = 20 and active;
  if v_count <> 18 or v_ped <> 8 or v_premios <> 0 then raise exception 'PRUEBA FALLÓ: tras quitar (% / % / premios %)', v_count, v_ped, v_premios; end if;

  -- 5) Quitar con pago pendiente también resta (solo se frena lo que sube).
  insert into public.pedido_pagos (pedido_id, metodo, monto, estado) values (p, 'efectivo', 50, 'pendiente');
  r := public.editar_pedido(p, jsonb_build_array(
    jsonb_build_object('id', it, 'product_id', null, 'sku', 'prueba-a', 'nombre', 'Prueba A', 'precio_unitario', 50, 'cantidad', 6)), 150, null, 'prueba', 'bajó a 6');
  select bottle_count into v_count from public.users where id = u;
  if v_count <> 16 then raise exception 'PRUEBA FALLÓ: con pendiente no restó (%)', v_count; end if;

  -- 6) La regla general sigue: bottle_count = 10 previos + suma de botellas_acreditadas.
  select coalesce(sum(botellas_acreditadas), 0) + 10 into v_ped from public.pedidos where user_id = u and botellas_acreditadas_at is not null;
  if v_count <> v_ped then raise exception 'PRUEBA FALLÓ: descuadre % ≠ %', v_count, v_ped; end if;
end;
$$;

select 'OK' as resultado, 'edición de pedidos: botellas sin duplicar, niveles y pagos pendientes' as detalle;

rollback;
