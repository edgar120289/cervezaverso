-- Cervezaverso — Ventas de un periodo calculadas en la base de datos (Resumen de /admin).
-- Ejecutar completo en el SQL Editor de Supabase (idempotente). Requiere 002_checkout_cuentas.sql (public.is_admin()).
-- Suma `total` y cuenta los pedidos cobrados (Pagado, Enviado, Entregado) desde `p_desde`.

create or replace function public.ventas_desde(p_desde timestamptz)
returns table (ventas numeric, pedidos bigint)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso restringido a administradores' using errcode = '42501';
  end if;

  return query
    select coalesce(sum(p.total), 0)::numeric, count(*)::bigint
      from public.pedidos p
     where p.estado in ('Pagado', 'Enviado', 'Entregado')
       and p.fecha >= p_desde;
end;
$$;

revoke all on function public.ventas_desde(timestamptz) from public, anon;
grant execute on function public.ventas_desde(timestamptz) to authenticated, service_role;

notify pgrst, 'reload schema';
