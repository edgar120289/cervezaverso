-- Cervezaverso — Garantiza RLS activo en public.users.
-- Las políticas de public.users existen (schema.sql y 002_checkout_cuentas.sql), pero sin RLS activo
-- no se aplican: Supabase lo reportó como alerta crítica. Idempotente: se puede correr más de una vez.

alter table public.users enable row level security;
