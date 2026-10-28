-- Cervezaverso — Seguridad: el costo del proveedor deja de ser público.
-- Ejecutar completo en el SQL Editor de Supabase ANTES de desplegar la rama (es idempotente).
--
-- Hasta hoy anon y authenticated tenían SELECT en toda la tabla `products`, así que la API REST
-- con la llave anónima devolvía cost_price, margin_pct y proveedor. Ahora esas tres columnas
-- solo las lee el service role (que usa /admin tras validar al administrador).
--
-- Importante: toda columna nueva de `products` que deba ser pública necesita su propio
-- `grant select (columna) on public.products to anon, authenticated;`.

revoke select on public.products from anon, authenticated;
revoke select (cost_price, margin_pct, proveedor) on public.products from anon, authenticated;

grant select (
  id, sku, name, brewery, gtin, country, pais, style, abv, volume_ml, sale_price, stock_status,
  badges, description_ai, pairing_ai, notas_origen, notas_perfil, notas_maridaje,
  image_url, image_urls, is_active, is_featured, retirado, pendiente, created_at, updated_at
) on public.products to anon, authenticated;

-- Comprobación: si alguna de las tres sigue visible, la migración falla y se deshace.
do $$
begin
  if has_column_privilege('anon', 'public.products', 'cost_price', 'select')
     or has_column_privilege('anon', 'public.products', 'margin_pct', 'select')
     or has_column_privilege('anon', 'public.products', 'proveedor', 'select')
     or has_column_privilege('authenticated', 'public.products', 'cost_price', 'select')
     or has_column_privilege('authenticated', 'public.products', 'margin_pct', 'select')
     or has_column_privilege('authenticated', 'public.products', 'proveedor', 'select') then
    raise exception 'Las columnas privadas de products siguen siendo legibles.';
  end if;
end $$;
