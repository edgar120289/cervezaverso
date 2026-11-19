-- 035 · Pedidos de invitado → cuenta
-- Al iniciar sesión o crear cuenta, los pedidos hechos como invitado con el MISMO correo
-- (solo si la cuenta tiene el correo confirmado) pasan a la cuenta. Devuelve cuántos se ligaron
-- y cuáles están cobrados sin botellas acreditadas; el servidor de Next los acredita después con
-- `acreditar_botellas` (idempotente), así que nunca se duplican botellas.
-- Solo aditiva: crea una función. Reversa: supabase/reversa/035_ligar_pedidos_invitado_down.sql

create or replace function public.ligar_pedidos_invitado(p_user_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
  v_confirmado timestamptz;
  v_ligados uuid[];
  v_por_acreditar uuid[];
begin
  select email, email_confirmed_at into v_email, v_confirmado from auth.users where id = p_user_id;
  -- Sin correo confirmado no se liga nada: así nadie se apropia de pedidos ajenos registrando su correo.
  if v_email is null or v_confirmado is null then
    return jsonb_build_object('ligados', 0, 'por_acreditar', '[]'::jsonb);
  end if;

  with ligados as (
    update public.pedidos
       set user_id = p_user_id
     where user_id is null
       and lower(cliente_email) = lower(v_email)
    returning id, estado, botellas_acreditadas_at
  )
  select coalesce(array_agg(id), '{}'),
         coalesce(array_agg(id) filter (
           where estado in ('Pagado', 'Enviado', 'Entregado') and botellas_acreditadas_at is null
         ), '{}')
    into v_ligados, v_por_acreditar
    from ligados;

  return jsonb_build_object('ligados', cardinality(v_ligados), 'por_acreditar', to_jsonb(v_por_acreditar));
end;
$$;

revoke all on function public.ligar_pedidos_invitado(uuid) from public, anon, authenticated;
grant execute on function public.ligar_pedidos_invitado(uuid) to service_role;

notify pgrst, 'reload schema';
