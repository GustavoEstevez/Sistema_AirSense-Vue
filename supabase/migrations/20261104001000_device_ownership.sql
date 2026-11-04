-- Tenant boundary for telemetry. Existing devices are assigned to the oldest
-- active account; administrators retain access for support and reassignment.

create table if not exists public.devices (
  id text primary key check (char_length(id) between 1 and 80),
  owner_id uuid references public.profiles(id) on delete set null,
  display_name text check (display_name is null or char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_memberships (
  device_id text not null references public.devices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_level text not null default 'viewer' check (access_level in ('viewer', 'manager')),
  created_at timestamptz not null default now(),
  primary key (device_id, user_id)
);

insert into public.devices (id, owner_id)
select distinct readings.device_id, (
  select profiles.id
  from public.profiles
  where profiles.status = 'active'
  order by profiles.created_at asc
  limit 1
)
from public.sensor_readings as readings
on conflict (id) do nothing;

create index if not exists devices_owner_idx on public.devices (owner_id);
create index if not exists device_memberships_user_idx on public.device_memberships (user_id, device_id);

alter table public.devices enable row level security;
alter table public.device_memberships enable row level security;
revoke all on public.devices from public, anon, authenticated;
revoke all on public.device_memberships from public, anon, authenticated;
grant select on public.devices to authenticated;
grant select on public.device_memberships to authenticated;

create or replace function public.current_user_can_access_device(p_device_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and status = 'active' and role_slug = 'admin'
  ) or exists (
    select 1
    from public.devices
    where id = p_device_id and owner_id = auth.uid()
  ) or exists (
    select 1
    from public.device_memberships
    where device_id = p_device_id and user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_can_access_device(text) from public, anon;
grant execute on function public.current_user_can_access_device(text) to authenticated;

drop policy if exists "Users can read assigned devices" on public.devices;
create policy "Users can read assigned devices"
  on public.devices for select to authenticated
  using (public.current_user_can_access_device(id));

drop policy if exists "Users can read their device memberships" on public.device_memberships;
create policy "Users can read their device memberships"
  on public.device_memberships for select to authenticated
  using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Active users can read telemetry" on public.sensor_readings;
drop policy if exists "Assigned users can read telemetry" on public.sensor_readings;
create policy "Assigned users can read telemetry"
  on public.sensor_readings for select to authenticated
  using (public.current_user_can_access_device(device_id));

comment on table public.devices is 'AirSense device ownership boundary. Unassigned devices are admin-only.';
comment on table public.device_memberships is 'Additional users authorized to read a device telemetry stream.';
