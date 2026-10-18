-- Margen de utilidad real (precio = costo / (1 - margen)): el valor por defecto pasa de 50 a 35.
-- Los productos que conservaban el 50% anterior (nunca personalizado) pasan a 35%.
alter table public.products alter column margin_pct set default 35;
update public.products set margin_pct = 35 where margin_pct = 50;
