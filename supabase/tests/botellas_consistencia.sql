-- Revisión de solo lectura: clientes cuyo users.bottle_count no es la suma de pedidos.botellas_acreditadas
-- de sus pedidos acreditados. Resultado esperado: ninguna fila.
select u.id, u.email, u.bottle_count, coalesce(sum(p.botellas_acreditadas), 0) as suma_pedidos
  from public.users u
  left join public.pedidos p on p.user_id = u.id and p.botellas_acreditadas_at is not null
 group by u.id, u.email, u.bottle_count
having u.bottle_count <> coalesce(sum(p.botellas_acreditadas), 0)
 order by u.email;
