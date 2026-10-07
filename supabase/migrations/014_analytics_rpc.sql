-- Cervezaverso — Analítica del Resumen de /admin calculada en la base de datos.
-- Ejecutar completo en el SQL Editor de Supabase (idempotente). Requiere 002_checkout_cuentas.sql (public.is_admin()).
--
-- Top de cervezas más vendidas: suma las botellas de pedidos cobrados (Pagado, Enviado, Entregado)
-- y devuelve solo las `p_limit` primeras, en lugar de mandar el historial a Next.js.
-- SECURITY DEFINER para agregar sin depender de RLS fila por fila; el acceso se limita
-- dentro de la función a admins (is_admin()) y se revoca a anon y public.

create or replace function public.top_cervezas_vendidas(p_limit integer default 3)
returns table (sku text, nombre text, botellas bigint)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso restringido a administradores' using errcode = '42501';
  end if;

  return query
    select i.sku, max(i.nombre) as nombre, sum(i.cantidad)::bigint as botellas
      from public.pedido_items i
      join public.pedidos p on p.id = i.pedido_id
     where p.estado in ('Pagado', 'Enviado', 'Entregado')
     group by i.sku
     order by sum(i.cantidad) desc, i.sku
     limit greatest(least(coalesce(p_limit, 3), 50), 1);
end;
$$;

revoke all on function public.top_cervezas_vendidas(integer) from public, anon;
grant execute on function public.top_cervezas_vendidas(integer) to authenticated, service_role;

notify pgrst, 'reload schema';
