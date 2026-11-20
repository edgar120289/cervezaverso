-- Prueba · ligar pedidos de invitado (035) + acreditar botellas (012/013)
-- Comprueba que, después de ligar y acreditar, users.bottle_count = suma de pedidos.botellas_acreditadas
-- de los pedidos acreditados de ese usuario, y que repetir el proceso no duplica nada.
-- Todo corre en una transacción que termina en ROLLBACK: no deja datos. Si algo falla, lanza «PRUEBA FALLÓ: …».
-- Uso: pegar completo en el SQL Editor de Supabase (o `psql -f`). Resultado esperado: una fila «OK».

begin;

do $$
declare
  u_ok uuid := gen_random_uuid();        -- cuenta con correo confirmado
  u_sin uuid := gen_random_uuid();       -- cuenta sin confirmar
  correo text := 'prueba-botellas-' || substr(u_ok::text, 1, 8) || '@example.com';
  correo_sin text := 'prueba-sin-confirmar-' || substr(u_sin::text, 1, 8) || '@example.com';
  p_pagado uuid := gen_random_uuid();    -- invitado, Pagado, 3 botellas → se liga y se acredita
  p_pendiente uuid := gen_random_uuid(); -- invitado, Pendiente, 4 botellas → se liga, no se acredita
  p_a_mano uuid := gen_random_uuid();    -- ya ligado y acreditado a mano (como #52858773), 5 botellas
  p_acreditado uuid := gen_random_uuid();-- sin dueño pero con botellas_acreditadas_at → no se toca
  p_ajeno uuid := gen_random_uuid();     -- otro correo → no se toca
  p_sin uuid := gen_random_uuid();       -- del correo sin confirmar → no se toca
  r jsonb;
  v_pedido uuid;
  v_count integer;
  v_suma integer;
begin
  insert into auth.users (id, email, email_confirmed_at) values (u_ok, correo, now()), (u_sin, correo_sin, null);
  -- Estado inicial coherente: la cuenta ya tiene las 5 botellas del pedido ligado a mano.
  update public.users set bottle_count = 5 where id = u_ok;

  insert into public.pedidos (id, cliente_nombre, cliente_email, estado, user_id, botellas_acreditadas, botellas_acreditadas_at) values
    (p_pagado,     'Prueba', upper(correo), 'Pagado',    null, null, null),
    (p_pendiente,  'Prueba', correo,        'Pendiente', null, null, null),
    (p_a_mano,     'Prueba', correo,        'Pagado',    u_ok, 5,    now()),
    (p_acreditado, 'Prueba', correo,        'Pagado',    null, 2,    now()),
    (p_ajeno,      'Prueba', 'otra-' || correo, 'Pagado', null, null, null),
    (p_sin,        'Prueba', correo_sin,    'Pagado',    null, null, null);
  insert into public.pedido_items (pedido_id, sku, nombre, precio_unitario, cantidad, importe) values
    (p_pagado, 'prueba-a', 'Prueba A', 50, 2, 100),
    (p_pagado, 'prueba-b', 'Prueba B', 50, 1, 50),
    (p_pendiente, 'prueba-a', 'Prueba A', 50, 4, 200),
    (p_a_mano, 'prueba-a', 'Prueba A', 50, 5, 250),
    (p_acreditado, 'prueba-a', 'Prueba A', 50, 2, 100),
    (p_ajeno, 'prueba-a', 'Prueba A', 50, 1, 50),
    (p_sin, 'prueba-a', 'Prueba A', 50, 1, 50);

  -- 1) Cuenta sin confirmar: no liga nada.
  r := public.ligar_pedidos_invitado(u_sin);
  if (r ->> 'ligados')::int <> 0 then raise exception 'PRUEBA FALLÓ: ligó pedidos de un correo sin confirmar (%)', r; end if;

  -- 2) Cuenta confirmada: liga solo el Pagado y el Pendiente; acredita solo el Pagado. Igual que ligarPedidosInvitado().
  r := public.ligar_pedidos_invitado(u_ok);
  if (r ->> 'ligados')::int <> 2 then raise exception 'PRUEBA FALLÓ: se esperaban 2 ligados (%)', r; end if;
  if r -> 'por_acreditar' <> to_jsonb(array[p_pagado]) then raise exception 'PRUEBA FALLÓ: por_acreditar inesperado (%)', r; end if;
  for v_pedido in select jsonb_array_elements_text(r -> 'por_acreditar')::uuid loop
    perform public.acreditar_botellas(v_pedido);
  end loop;

  if (select user_id from public.pedidos where id = p_acreditado) is not null then raise exception 'PRUEBA FALLÓ: ligó un pedido ya acreditado'; end if;
  if (select user_id from public.pedidos where id = p_ajeno) is not null then raise exception 'PRUEBA FALLÓ: ligó un pedido de otro correo'; end if;
  if (select user_id from public.pedidos where id = p_sin) is not null then raise exception 'PRUEBA FALLÓ: ligó un pedido del correo sin confirmar'; end if;

  -- 3) La regla: bottle_count = suma de botellas_acreditadas de sus pedidos acreditados (5 + 3 = 8).
  select bottle_count into v_count from public.users where id = u_ok;
  select coalesce(sum(botellas_acreditadas), 0) into v_suma from public.pedidos where user_id = u_ok and botellas_acreditadas_at is not null;
  if v_count <> v_suma or v_count <> 8 then raise exception 'PRUEBA FALLÓ: bottle_count % ≠ suma % (esperado 8)', v_count, v_suma; end if;

  -- 4) Repetir (otro inicio de sesión) no duplica: nada nuevo que ligar y acreditar_botellas es idempotente.
  r := public.ligar_pedidos_invitado(u_ok);
  if (r ->> 'ligados')::int <> 0 then raise exception 'PRUEBA FALLÓ: volvió a ligar (%)', r; end if;
  perform public.acreditar_botellas(p_pagado);
  perform public.acreditar_botellas(p_a_mano);
  select bottle_count into v_count from public.users where id = u_ok;
  if v_count <> 8 then raise exception 'PRUEBA FALLÓ: tras repetir, bottle_count = % (esperado 8)', v_count; end if;

  -- 5) El Pendiente que se paga después también cuadra (5 + 3 + 4 = 12).
  update public.pedidos set estado = 'Pagado' where id = p_pendiente;
  perform public.acreditar_botellas(p_pendiente);
  select bottle_count into v_count from public.users where id = u_ok;
  select coalesce(sum(botellas_acreditadas), 0) into v_suma from public.pedidos where user_id = u_ok and botellas_acreditadas_at is not null;
  if v_count <> v_suma or v_count <> 12 then raise exception 'PRUEBA FALLÓ: tras pagar el pendiente, bottle_count % ≠ suma % (esperado 12)', v_count, v_suma; end if;
end;
$$;

select 'OK' as resultado, 'ligar + acreditar: bottle_count = suma de botellas_acreditadas, sin duplicar' as detalle;

rollback;
