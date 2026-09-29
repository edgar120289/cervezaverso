-- Cervezaverso — Verificación de mayoría de edad y límite de intentos.
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente: se puede correr más de una vez).
-- Requiere 002_checkout_cuentas.sql.

-- ─────────────────────────────────────────────────────────────
-- users.fecha_nacimiento: se captura al registrarse (metadata de Auth).
-- El cliente no puede editarla: 002 sólo concede UPDATE (full_name).
-- ─────────────────────────────────────────────────────────────
alter table public.users
  add column if not exists fecha_nacimiento date;

-- Rechaza el registro si la fecha viene y es de un menor de 18 años o no es válida.
-- La Server Action ya lo valida; esto cubre llamadas directas a la API de Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_raw text := new.raw_user_meta_data ->> 'fecha_nacimiento';
  v_fecha date;
begin
  if v_raw is not null then
    begin
      v_fecha := v_raw::date;
    exception when others then
      raise exception 'fecha_nacimiento inválida';
    end;
    if v_fecha > (current_date - interval '18 years')::date or v_fecha < date '1900-01-01' then
      raise exception 'Registro exclusivo para mayores de 18 años';
    end if;
  end if;

  insert into public.users (id, email, fecha_nacimiento)
  values (new.id, new.email, v_fecha);
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- pedidos.cliente_fecha_nacimiento: evidencia de la edad declarada en cada compra
-- (también en compras como invitado).
-- ─────────────────────────────────────────────────────────────
alter table public.pedidos
  add column if not exists cliente_fecha_nacimiento date;

-- ─────────────────────────────────────────────────────────────
-- rate_limits: ventana fija por llave (acción + hash de IP). Compartido entre
-- todas las funciones serverless, a diferencia de un contador en memoria.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limits enable row level security;
-- Sin políticas: sólo service_role (que ignora RLS) puede leerla o escribirla.
revoke all on public.rate_limits from public, anon, authenticated;
grant all on public.rate_limits to service_role;

-- Registra un intento y devuelve true si todavía está dentro del límite.
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end,
        window_start = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end
  returning hits into v_hits;

  -- Limpieza oportunista de ventanas viejas (más de un día).
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
