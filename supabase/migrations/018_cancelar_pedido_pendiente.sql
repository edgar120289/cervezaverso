-- Cancela un pedido Pendiente abandonado y devuelve el uso del cupón, todo en una transacción.
-- Solo service_role (Server Action de admin): ningún cliente puede cancelar sus propios pedidos.
-- El stock es un estado de la tabla products, no se descuenta al crear el pedido: no hay nada que reponer.
-- Idempotente: si el pedido ya no está Pendiente no hace nada, así el cupón no se devuelve dos veces.
-- Las recompensas de lealtad (reward_level) nunca pasan por el checkout y no se tocan.
create or replace function public.cancelar_pedido_pendiente(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_code text;
  v_liberado boolean := false;
begin
  update public.pedidos
     set estado = 'Cancelado'
   where id = p_pedido_id and estado = 'Pendiente'
  returning promo_code into v_code;

  if not found then
    return jsonb_build_object('status', 'no_pendiente');
  end if;

  if v_code is not null then
    update public.promo_codes
       set times_used = greatest(times_used - 1, 0)
     where code = v_code and reward_level is null;
    v_liberado := found;
  end if;

  return jsonb_build_object('status', 'cancelado', 'cupon_liberado', v_liberado);
end;
$$;

revoke all on function public.cancelar_pedido_pendiente(uuid) from public, anon, authenticated;
grant execute on function public.cancelar_pedido_pendiente(uuid) to service_role;
