-- 036 · Edición de pedidos desde el panel (Etapa B1)
-- Solo aditiva: tablas nuevas (pagos, notas internas, bitácora), una columna en pedido_items y dos funciones.
-- Reversa: supabase/reversa/036_editar_pedidos_down.sql

-- 1) Renglones agregados después de crear el pedido (se marcan en el PDF).
alter table public.pedido_items add column if not exists agregado boolean not null default false;

-- 2) Historial de pagos: el original nunca se borra; los adicionales pueden quedar pendientes.
create table if not exists public.pedido_pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  metodo text not null check (metodo in ('mercadopago', 'transferencia', 'efectivo')),
  monto numeric(10, 2) not null check (monto > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'recibido')),
  es_original boolean not null default false,
  referencia text check (char_length(referencia) <= 120),
  fecha timestamptz not null default now(),
  recibido_at timestamptz,
  creado_por text,
  created_at timestamptz not null default now()
);
create index if not exists pedido_pagos_pedido_idx on public.pedido_pagos (pedido_id);
create unique index if not exists pedido_pagos_un_original on public.pedido_pagos (pedido_id) where es_original;

-- 3) Notas internas del equipo: nunca se muestran al cliente (pedidos.notas sigue siendo «Notas del cliente»).
create table if not exists public.pedido_notas_internas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 2000),
  autor text,
  created_at timestamptz not null default now()
);
create index if not exists pedido_notas_internas_pedido_idx on public.pedido_notas_internas (pedido_id);

-- 4) Bitácora de cambios: qué, quién y cuándo.
create table if not exists public.pedido_bitacora (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  accion text not null,
  detalle text,
  autor text,
  created_at timestamptz not null default now()
);
create index if not exists pedido_bitacora_pedido_idx on public.pedido_bitacora (pedido_id, created_at desc);

-- Solo el servidor (service role, tras requireAdmin) lee y escribe estas tablas.
alter table public.pedido_pagos enable row level security;
alter table public.pedido_notas_internas enable row level security;
alter table public.pedido_bitacora enable row level security;
revoke all on public.pedido_pagos, public.pedido_notas_internas, public.pedido_bitacora from public, anon, authenticated;
grant select, insert, update, delete on public.pedido_pagos, public.pedido_notas_internas, public.pedido_bitacora to service_role;

-- 5) Botellas de un pedido ya acreditado que cambió (productos agregados o quitados, o pago adicional recibido).
--    Objetivo = piezas del pedido; mientras haya un pago pendiente, solo se permite bajar (lo agregado suma
--    hasta que se recibe el pago). Ajusta pedidos.botellas_acreditadas y users.bottle_count por la diferencia,
--    con los mismos niveles 20/40/60 que acreditar_botellas y la misma baja de premios que revertir_botellas.
create or replace function public.sincronizar_botellas_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_piezas integer;
  v_pendiente boolean;
  v_objetivo integer;
  v_diff integer;
  v_antes integer;
  v_despues integer;
  v_nivel integer;
  v_label text;
  v_valor numeric;
  v_code text;
  v_premios jsonb := '[]'::jsonb;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then return jsonb_build_object('status', 'no_encontrado'); end if;
  -- Sin acreditar aún: acreditar_botellas sumará las piezas que tenga al pagarse.
  if v_pedido.botellas_acreditadas_at is null or v_pedido.user_id is null then
    return jsonb_build_object('status', 'sin_acreditar');
  end if;
  if v_pedido.estado not in ('Pagado', 'Enviado', 'Entregado') then
    return jsonb_build_object('status', 'no_pagado');
  end if;

  select coalesce(sum(cantidad), 0) into v_piezas from public.pedido_items where pedido_id = p_pedido_id;
  select exists (select 1 from public.pedido_pagos where pedido_id = p_pedido_id and estado = 'pendiente') into v_pendiente;
  v_objetivo := case when v_pendiente then least(v_piezas, coalesce(v_pedido.botellas_acreditadas, 0)) else v_piezas end;
  v_diff := v_objetivo - coalesce(v_pedido.botellas_acreditadas, 0);
  if v_diff = 0 then
    return jsonb_build_object('status', 'sin_cambio', 'botellas', v_objetivo, 'pendiente', v_pendiente);
  end if;

  update public.users
     set bottle_count = greatest(bottle_count + v_diff, 0)
   where id = v_pedido.user_id
  returning bottle_count into v_despues;
  if not found then return jsonb_build_object('status', 'sin_cuenta'); end if;
  v_antes := v_despues - v_diff;

  if v_diff > 0 then
    foreach v_nivel in array array[20, 40, 60] loop
      if v_antes < v_nivel and v_despues >= v_nivel then
        v_code := 'RECOMPENSA-' || v_nivel || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
        v_valor := 100;
        if v_nivel = 20 then v_label := 'Cerveza Sorpresa';
        elsif v_nivel = 40 then v_label := 'Cristalería Gratis';
        else v_label := 'Playera + 10% Extra'; v_valor := 10;
        end if;
        insert into public.promo_codes (code, discount_type, value, max_uses, user_id, reward_level, reward_label)
        values (v_code, 'percent', v_valor, 1, v_pedido.user_id, v_nivel, v_label)
        on conflict (user_id, reward_level) where reward_level is not null
          do update set active = true where public.promo_codes.times_used = 0
        returning code into v_code;
        if v_code is not null then
          v_premios := v_premios || jsonb_build_object('nivel', v_nivel, 'code', v_code, 'label', v_label);
        end if;
      end if;
    end loop;
    if v_despues >= 60 then update public.users set niveles_secretos = true where id = v_pedido.user_id; end if;
  else
    update public.promo_codes
       set active = false
     where user_id = v_pedido.user_id and reward_level is not null and times_used = 0 and reward_level > v_despues;
    if v_despues < 60 then update public.users set niveles_secretos = false where id = v_pedido.user_id; end if;
  end if;

  update public.pedidos set botellas_acreditadas = v_objetivo where id = p_pedido_id;

  return jsonb_build_object(
    'status', 'ajustado', 'diferencia', v_diff, 'botellas', v_objetivo, 'total', v_despues,
    'pendiente', v_pendiente, 'email', v_pedido.cliente_email, 'nombre', v_pedido.cliente_nombre, 'premios', v_premios
  );
end;
$$;

-- 6) Edición atómica de renglones, envío y notas del cliente; recalcula totales y sincroniza botellas.
--    p_items: [{ id?, product_id, sku, nombre, precio_unitario, cantidad }]; los que no traen id son nuevos (agregado).
--    Los descuentos ya aplicados se conservan; el total nunca baja de 0.
create or replace function public.editar_pedido(
  p_pedido_id uuid, p_items jsonb, p_costo_envio numeric, p_notas text, p_autor text, p_resumen text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item jsonb;
  v_ids uuid[];
  v_subtotal numeric;
  v_total numeric;
  v_botellas jsonb;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then return jsonb_build_object('status', 'no_encontrado'); end if;
  if v_pedido.estado = 'Cancelado' then return jsonb_build_object('status', 'cancelado'); end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('status', 'sin_productos');
  end if;

  select coalesce(array_agg((e ->> 'id')::uuid), '{}') into v_ids
    from jsonb_array_elements(p_items) e where e ? 'id' and e ->> 'id' is not null;
  delete from public.pedido_items where pedido_id = p_pedido_id and not (id = any (v_ids));

  for v_item in select * from jsonb_array_elements(p_items) loop
    if v_item ->> 'id' is not null then
      update public.pedido_items
         set cantidad = (v_item ->> 'cantidad')::int,
             precio_unitario = (v_item ->> 'precio_unitario')::numeric,
             importe = (v_item ->> 'cantidad')::int * (v_item ->> 'precio_unitario')::numeric
       where id = (v_item ->> 'id')::uuid and pedido_id = p_pedido_id;
    else
      insert into public.pedido_items (pedido_id, product_id, sku, nombre, precio_unitario, cantidad, importe, agregado)
      values (
        p_pedido_id, (v_item ->> 'product_id')::uuid, v_item ->> 'sku', v_item ->> 'nombre',
        (v_item ->> 'precio_unitario')::numeric, (v_item ->> 'cantidad')::int,
        (v_item ->> 'cantidad')::int * (v_item ->> 'precio_unitario')::numeric, true
      );
    end if;
  end loop;

  select coalesce(sum(importe), 0) into v_subtotal from public.pedido_items where pedido_id = p_pedido_id;
  v_total := greatest(v_subtotal - coalesce(v_pedido.descuento, 0) - coalesce(v_pedido.descuento_volumen, 0) + p_costo_envio, 0);
  update public.pedidos
     set subtotal = v_subtotal, costo_envio = p_costo_envio, total = v_total, notas = nullif(btrim(p_notas), '')
   where id = p_pedido_id;

  insert into public.pedido_bitacora (pedido_id, accion, detalle, autor)
  values (p_pedido_id, 'Pedido editado', p_resumen, p_autor);

  v_botellas := public.sincronizar_botellas_pedido(p_pedido_id);
  return jsonb_build_object('status', 'editado', 'total_anterior', v_pedido.total, 'total', v_total, 'botellas', v_botellas);
end;
$$;

revoke all on function public.sincronizar_botellas_pedido(uuid) from public, anon, authenticated;
revoke all on function public.editar_pedido(uuid, jsonb, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.sincronizar_botellas_pedido(uuid) to service_role;
grant execute on function public.editar_pedido(uuid, jsonb, numeric, text, text, text) to service_role;

-- 7) Pago original de los pedidos ya cobrados (monto = total), para que el historial empiece completo.
insert into public.pedido_pagos (pedido_id, metodo, monto, estado, es_original, referencia, fecha, recibido_at, creado_por)
select p.id, coalesce(p.metodo_pago, 'mercadopago'), p.total, 'recibido', true, p.mp_payment_id, p.fecha, p.fecha, 'migración 036'
  from public.pedidos p
 where p.estado in ('Pagado', 'Enviado', 'Entregado') and p.total > 0
   and p.id <> '7e31abc4-ddc1-4296-b05f-f1c92b770e81'
   and not exists (select 1 from public.pedido_pagos x where x.pedido_id = p.id);

-- 8) Caso #7E31ABC4: Mercado Pago cubrió $1,250; los $195 de Betulita y Pumpkin de Olla quedan por transferencia.
--    Sus 8 botellas ya están acreditadas (pedido y users.bottle_count): no se vuelven a sumar.
do $$
declare
  v_id constant uuid := '7e31abc4-ddc1-4296-b05f-f1c92b770e81';
  v_nota text;
begin
  if not exists (select 1 from public.pedidos where id = v_id) then return; end if;
  if exists (select 1 from public.pedido_pagos where pedido_id = v_id) then return; end if;

  insert into public.pedido_pagos (pedido_id, metodo, monto, estado, es_original, referencia, fecha, recibido_at, creado_por)
  select id, 'mercadopago', 1250, 'recibido', true, mp_payment_id, fecha, fecha, 'migración 036'
    from public.pedidos where id = v_id;
  insert into public.pedido_pagos (pedido_id, metodo, monto, estado, es_original, fecha, creado_por)
  values (v_id, 'transferencia', 195, 'pendiente', false, '2026-11-19 12:00:00-06', 'migración 036');

  update public.pedido_items set agregado = true
   where pedido_id = v_id and sku in ('CVZ-REYARBOLBEEA592B', 'CVZ-SANTASABIN4F2579');

  select notas into v_nota from public.pedidos where id = v_id;
  if v_nota is not null then
    insert into public.pedido_notas_internas (pedido_id, texto, autor, created_at)
    values (v_id, v_nota, 'migración 036', '2026-11-19 12:00:00-06');
    update public.pedidos set notas = null where id = v_id;
  end if;

  insert into public.pedido_bitacora (pedido_id, accion, detalle, autor) values
    (v_id, 'Migración', 'Pago original de Mercado Pago $1,250 (recibido) y pago adicional de $195 por transferencia (pendiente). Nota pasada a notas internas. Betulita y Pumpkin de Olla marcadas como agregadas. Botellas sin cambio (8).', 'migración 036');
end;
$$;
