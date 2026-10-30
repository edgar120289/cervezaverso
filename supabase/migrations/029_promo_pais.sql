-- 029 · Códigos por país y con vigencia («Graciela viaja por el mundo»).
-- country: el código solo descuenta las cervezas de ese país (se compara con countryKey en el servidor).
-- starts_at / ends_at: ventana de vigencia (null = sin límite). Se valida en findActivePromo.
alter table public.promo_codes add column if not exists country text;
alter table public.promo_codes add column if not exists starts_at timestamptz;
alter table public.promo_codes add column if not exists ends_at timestamptz;
alter table public.promo_codes drop constraint if exists promo_codes_vigencia;
alter table public.promo_codes add constraint promo_codes_vigencia check (starts_at is null or ends_at is null or starts_at < ends_at);
