-- Cervezaverso — Motor de lealtad: acreditación de botellas y cupones de recompensa.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 004_promo_codes.sql y 011_users_tribu_botellas.sql.
--
-- Reutiliza `promo_codes` (ya existe) y la extiende: un cupón con `reward_level` es una
-- recompensa personal (de un solo uso, ligada a `user_id`) que se canjea de forma manual;
-- el checkout web NO la aplica (el 100% de descuento de la Cerveza Sorpresa vaciaría el pedido).

alter table public.promo_codes
  add column if not exists user_id uuid references public.users (id) on delete cascade,
  add column if not exists reward_level integer check (reward_level is null or reward_level > 0),
  add column if not exists reward_label text;

-- Una sola recompensa por nivel y cliente: vuelve idempotente la entrega.
create unique index if not exists promo_codes_user_reward_idx
  on public.promo_codes (user_id, reward_level) where reward_level is not null;

-- Cada cliente ve únicamente sus propias recompensas (las demás filas siguen siendo solo de admin).
drop policy if exists "Los clientes ven sus recompensas" on public.promo_codes;
create policy "Los clientes ven sus recompensas"
  on public.promo_codes for select
  using (user_id = auth.uid() and reward_level is not null);

alter table public.users
  add column if not exists niveles_secretos boolean not null default false;

-- Marca el pedido ya contado para que reintentos del webhook no sumen dos veces.
alter table public.pedidos
  add column if not exists botellas_acreditadas_at timestamptz;

-- ─────────────────────────────────────────────────────────────
-- Acredita las botellas de un pedido pagado y entrega los premios que se crucen.
-- Atómica (bloquea el pedido) e idempotente. Solo service_role la ejecuta.
-- ─────────────────────────────────────────────────────────────
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
  v_tipo text;
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
      v_tipo := 'percent';
      v_valor := 100;
      if v_nivel = 20 then
        v_label := 'Cerveza Sorpresa';
      elsif v_nivel = 40 then
        v_label := 'Cristalería Gratis';
      else
        v_label := 'Playera + 10% Extra';
        v_valor := 10;
      end if;

      insert into public.promo_codes (code, discount_type, value, max_uses, user_id, reward_level, reward_label)
      values (v_code, v_tipo, v_valor, 1, v_pedido.user_id, v_nivel, v_label)
      on conflict (user_id, reward_level) where reward_level is not null do nothing;

      if found then
        v_premios := v_premios || jsonb_build_object('nivel', v_nivel, 'code', v_code, 'label', v_label);
      end if;
    end if;
  end loop;

  if v_despues >= 60 then
    update public.users set niveles_secretos = true where id = v_pedido.user_id;
  end if;

  update public.pedidos set botellas_acreditadas_at = now() where id = p_pedido_id;

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

revoke all on function public.acreditar_botellas(uuid) from public, anon, authenticated;
grant execute on function public.acreditar_botellas(uuid) to service_role;

notify pgrst, 'reload schema';
