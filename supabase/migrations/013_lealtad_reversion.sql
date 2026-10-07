-- Cervezaverso — Reversión de lealtad al cancelar un pedido.
-- Ejecutar completo en el SQL Editor de Supabase (idempotente). Requiere 012_lealtad_recompensas.sql.
--
-- `botellas_acreditadas` guarda las botellas exactas que sumó el pedido. Al cancelarlo se
-- restan y se limpian ambas marcas: una segunda cancelación no hace nada (idempotente) y, si el
-- pedido vuelve a pagarse, se acredita de nuevo.

alter table public.pedidos
  add column if not exists botellas_acreditadas integer check (botellas_acreditadas is null or botellas_acreditadas >= 0);

create or replace function public.acreditar_botellas(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_botellas integer;
  v_antes integer;
  v_despues integer;
  v_nivel integer;
  v_label text;
  v_valor numeric;
  v_code text;
  v_premios jsonb := '[]'::jsonb;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return jsonb_build_object('status', 'no_encontrado');
  end if;
  if v_pedido.estado not in ('Pagado', 'Enviado', 'Entregado') then
    return jsonb_build_object('status', 'no_pagado');
  end if;
  if v_pedido.botellas_acreditadas_at is not null then
    return jsonb_build_object('status', 'ya_acreditado');
  end if;
  if v_pedido.user_id is null then
    return jsonb_build_object('status', 'sin_cuenta');
  end if;

  select coalesce(sum(cantidad), 0) into v_botellas from public.pedido_items where pedido_id = p_pedido_id;

  update public.users
     set bottle_count = bottle_count + v_botellas
   where id = v_pedido.user_id
  returning bottle_count into v_despues;
  if not found then
    return jsonb_build_object('status', 'sin_cuenta');
  end if;
  v_antes := v_despues - v_botellas;

  foreach v_nivel in array array[20, 40, 60] loop
    if v_antes < v_nivel and v_despues >= v_nivel then
      v_code := 'RECOMPENSA-' || v_nivel || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      v_valor := 100;
      if v_nivel = 20 then
        v_label := 'Cerveza Sorpresa';
      elsif v_nivel = 40 then
        v_label := 'Cristalería Gratis';
      else
        v_label := 'Playera + 10% Extra';
        v_valor := 10;
      end if;

      -- Si el nivel ya tenía cupón (revocado por una cancelación), se reactiva el mismo código
      -- mientras no se haya canjeado; así nunca hay dos recompensas por nivel.
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

  if v_despues >= 60 then
    update public.users set niveles_secretos = true where id = v_pedido.user_id;
  end if;

  update public.pedidos
     set botellas_acreditadas_at = now(), botellas_acreditadas = v_botellas
   where id = p_pedido_id;

  return jsonb_build_object(
    'status', 'acreditado',
    'botellas', v_botellas,
    'total', v_despues,
    'email', v_pedido.cliente_email,
    'nombre', v_pedido.cliente_nombre,
    'premios', v_premios
  );
end;
$$;

-- Resta las botellas exactas que sumó un pedido que ahora está Cancelado.
-- No hace nada si nunca sumó (siempre Pendiente) o si ya se revirtió.
create or replace function public.revertir_botellas(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_total integer;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return jsonb_build_object('status', 'no_encontrado');
  end if;
  if v_pedido.estado <> 'Cancelado' then
    return jsonb_build_object('status', 'no_cancelado');
  end if;
  if v_pedido.botellas_acreditadas_at is null or v_pedido.user_id is null then
    return jsonb_build_object('status', 'sin_acreditar');
  end if;

  update public.users
     set bottle_count = greatest(bottle_count - coalesce(v_pedido.botellas_acreditadas, 0), 0)
   where id = v_pedido.user_id
  returning bottle_count into v_total;

  -- Recompensas sin canjear de niveles que el cliente ya no alcanza: se desactivan (no se borran).
  update public.promo_codes
     set active = false
   where user_id = v_pedido.user_id
     and reward_level is not null
     and times_used = 0
     and reward_level > v_total;

  if v_total < 60 then
    update public.users set niveles_secretos = false where id = v_pedido.user_id;
  end if;

  update public.pedidos set botellas_acreditadas_at = null, botellas_acreditadas = null where id = p_pedido_id;

  return jsonb_build_object('status', 'revertido', 'botellas', coalesce(v_pedido.botellas_acreditadas, 0), 'total', v_total);
end;
$$;

revoke all on function public.acreditar_botellas(uuid) from public, anon, authenticated;
revoke all on function public.revertir_botellas(uuid) from public, anon, authenticated;
grant execute on function public.acreditar_botellas(uuid) to service_role;
grant execute on function public.revertir_botellas(uuid) to service_role;

notify pgrst, 'reload schema';
