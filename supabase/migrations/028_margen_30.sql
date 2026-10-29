-- Margen por defecto 35 % → 30 % (misma regla: costo / (1 - margen), hacia abajo al múltiplo de 5).
-- Solo cambian los productos con el 35 % por defecto; los márgenes personalizados se respetan.
-- Respaldo de precios en respaldo.products_precios_20261029.
create table if not exists respaldo.products_precios_20261029 as
  select id, sku, margin_pct, sale_price from public.products;

alter table public.products alter column margin_pct set default 30;

update public.products
   set margin_pct = 30,
       sale_price = floor((cost_price / 0.70 + 1e-9) / 5) * 5
 where margin_pct = 35 and cost_price is not null;
