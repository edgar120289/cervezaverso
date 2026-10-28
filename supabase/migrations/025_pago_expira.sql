-- Cervezaverso — Vencimiento de los pagos con Mercado Pago.
-- Cada preferencia de Checkout Pro (la del checkout y la de «Reintentar pago») vence a las 72 h,
-- incluidas las fichas de OXXO y SPEI. `pago_expira_at` guarda ese vencimiento para que la tarea
-- diaria `/api/cron/cancelar-pendientes` cancele los pedidos que ya no se pueden pagar.
-- Sin valor (pedidos anteriores), la tarea usa `fecha` + 72 h.
-- Es solo una columna nueva: se puede correr antes o después de desplegar el código.

alter table public.pedidos add column if not exists pago_expira_at timestamptz;
