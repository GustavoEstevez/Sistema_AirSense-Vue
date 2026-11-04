-- Optional technical telemetry for each AirSense station. These columns do not
-- alter the environmental readings table and remain nullable for old firmware.

alter table public.devices
  add column if not exists wifi_rssi smallint,
  add column if not exists uptime_seconds bigint,
  add column if not exists firmware_version text,
  add column if not exists battery_percent numeric(5, 2),
  add column if not exists last_seen_at timestamptz;

alter table public.devices
  drop constraint if exists devices_wifi_rssi_check,
  add constraint devices_wifi_rssi_check check (wifi_rssi is null or wifi_rssi between -120 and 0),
  drop constraint if exists devices_uptime_seconds_check,
  add constraint devices_uptime_seconds_check check (uptime_seconds is null or uptime_seconds >= 0),
  drop constraint if exists devices_firmware_version_check,
  add constraint devices_firmware_version_check check (firmware_version is null or char_length(firmware_version) between 1 and 40),
  drop constraint if exists devices_battery_percent_check,
  add constraint devices_battery_percent_check check (battery_percent is null or battery_percent between 0 and 100);

create or replace function public.update_owned_device_name(p_device_id text, p_display_name text)
returns public.devices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(p_display_name), '');
  v_device public.devices;
begin
  if auth.uid() is null then
    raise exception 'Iniciá sesión para continuar.' using errcode = '42501';
  end if;

  if v_name is null or char_length(v_name) > 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '22023';
  end if;

  update public.devices as devices
  set display_name = v_name, updated_at = now()
  where devices.id = p_device_id
    and (
      devices.owner_id = auth.uid()
      or exists (
        select 1 from public.device_memberships as memberships
        where memberships.device_id = devices.id
          and memberships.user_id = auth.uid()
          and memberships.access_level = 'manager'
      )
      or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.status = 'active'
          and profiles.role_slug = 'admin'
      )
    )
  returning devices.* into v_device;

  if v_device.id is null then
    raise exception 'No tenés permisos para modificar este dispositivo.' using errcode = '42501';
  end if;

  return v_device;
end;
$$;

revoke all on function public.update_owned_device_name(text, text) from public, anon;
grant execute on function public.update_owned_device_name(text, text) to authenticated;

alter table public.devices replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'devices'
  ) then
    alter publication supabase_realtime add table public.devices;
  end if;
end;
$$;

comment on column public.devices.wifi_rssi is 'Latest Wi-Fi RSSI reported by the ESP32, in dBm.';
comment on column public.devices.uptime_seconds is 'Latest ESP32 uptime reported by firmware.';
comment on column public.devices.firmware_version is 'Firmware semantic version last reported by the station.';
comment on column public.devices.battery_percent is 'Optional battery estimate. Null until battery hardware is installed.';
comment on column public.devices.last_seen_at is 'Timestamp of the latest valid ingest received from the station.';
