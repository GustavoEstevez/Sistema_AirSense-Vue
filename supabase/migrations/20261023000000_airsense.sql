-- AirSense: almacenamiento, seguridad y tiempo real.
create extension if not exists pgcrypto;

create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  temperature double precision not null check (temperature between -40 and 85),
  humidity double precision not null check (humidity between 0 and 100),
  noise double precision not null check (noise between 0 and 160),
  co2 double precision not null check (co2 between 0 and 10000),
  device_id text not null default 'airsense-01' check (char_length(device_id) between 1 and 80),
  recorded_at timestamptz not null default now()
);

create index if not exists sensor_readings_recorded_at_idx
  on public.sensor_readings (recorded_at desc);
create index if not exists sensor_readings_device_time_idx
  on public.sensor_readings (device_id, recorded_at desc);

comment on table public.sensor_readings is 'Lecturas ambientales recibidas desde estaciones AirSense.';

alter table public.sensor_readings enable row level security;

drop policy if exists "Public readings are visible" on public.sensor_readings;
create policy "Public readings are visible"
  on public.sensor_readings
  for select
  to anon, authenticated
  using (true);

grant select on public.sensor_readings to anon, authenticated;
revoke insert, update, delete on public.sensor_readings from anon, authenticated;

-- Registro privado para aplicar límites de frecuencia a los correos.
create table if not exists public.email_dispatches (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('automatic_alert', 'manual_reading')),
  recipient_hash text not null,
  reading_id uuid references public.sensor_readings(id) on delete set null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  provider_id text,
  sent_at timestamptz not null default now()
);

create index if not exists email_dispatches_rate_limit_idx
  on public.email_dispatches (kind, recipient_hash, sent_at desc);

alter table public.email_dispatches enable row level security;
revoke all on public.email_dispatches from anon, authenticated;

-- Reserva atómica de un envío: evita correos duplicados si entran dos lecturas
-- críticas casi al mismo tiempo.
create or replace function public.claim_email_dispatch(
  p_kind text,
  p_recipient_hash text,
  p_reading_id uuid,
  p_cooldown_seconds integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  if p_kind not in ('automatic_alert', 'manual_reading')
    or p_cooldown_seconds < 1
    or p_recipient_hash = '' then
    raise exception 'Invalid email dispatch claim';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_kind || ':' || p_recipient_hash));

  if exists (
    select 1 from public.email_dispatches
    where kind = p_kind
      and recipient_hash = p_recipient_hash
      and sent_at >= now() - make_interval(secs => p_cooldown_seconds)
  ) then
    return null;
  end if;

  insert into public.email_dispatches (kind, recipient_hash, reading_id, status)
  values (p_kind, p_recipient_hash, p_reading_id, 'pending')
  returning id into claimed_id;
  return claimed_id;
end;
$$;

revoke all on function public.claim_email_dispatch(text, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_email_dispatch(text, text, uuid, integer) to service_role;

alter table public.sensor_readings replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.sensor_readings;
exception
  when duplicate_object then null;
end $$;
