-- AirSense user management: Supabase Auth remains the sole password/session authority.

create table if not exists public.app_roles (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_-]{1,39}$'),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

insert into public.app_roles (slug, name, description) values
  ('admin', 'Administrador', 'Gestiona usuarios, roles y estados.'),
  ('user', 'Usuario', 'Accede a las funciones habilitadas de AirSense.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 2 and 80),
  last_name text not null check (char_length(last_name) between 2 and 80),
  email text not null,
  role_slug text not null default 'user' references public.app_roles(slug),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists profiles_role_status_idx on public.profiles (role_slug, status);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  given_name text := trim(coalesce(new.raw_user_meta_data ->> 'first_name', 'Usuario'));
  family_name text := trim(coalesce(new.raw_user_meta_data ->> 'last_name', 'AirSense'));
begin
  insert into public.profiles (id, first_name, last_name, email, last_login_at)
  values (
    new.id,
    left(case when char_length(given_name) >= 2 then given_name else 'Usuario' end, 80),
    left(case when char_length(family_name) >= 2 then family_name else 'AirSense' end, 80),
    lower(new.email),
    new.last_sign_in_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(new.email), last_login_at = new.last_sign_in_at
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, last_sign_in_at on auth.users
  for each row execute function public.handle_auth_user_updated();

insert into public.profiles (id, first_name, last_name, email, last_login_at)
select
  id,
  left(case when char_length(trim(coalesce(raw_user_meta_data ->> 'first_name', ''))) >= 2 then trim(raw_user_meta_data ->> 'first_name') else 'Usuario' end, 80),
  left(case when char_length(trim(coalesce(raw_user_meta_data ->> 'last_name', ''))) >= 2 then trim(raw_user_meta_data ->> 'last_name') else 'AirSense' end, 80),
  lower(email),
  last_sign_in_at
from auth.users
where email is not null
on conflict (id) do nothing;

alter table public.app_roles enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can read roles" on public.app_roles;
create policy "Authenticated users can read roles"
  on public.app_roles for select to authenticated using (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.app_roles to authenticated;

create or replace function public.update_own_profile(p_first_name text, p_last_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  clean_first text := trim(coalesce(p_first_name, ''));
  clean_last text := trim(coalesce(p_last_name, ''));
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if char_length(clean_first) not between 2 and 80 or char_length(clean_last) not between 2 and 80 then
    raise exception 'Nombre y apellido deben tener entre 2 y 80 caracteres';
  end if;
  update public.profiles
  set first_name = clean_first, last_name = clean_last
  where id = auth.uid() and status = 'active'
  returning * into result;
  if result.id is null then raise exception 'Cuenta no disponible'; end if;
  return result;
end;
$$;

revoke all on function public.update_own_profile(text, text) from public, anon;
grant execute on function public.update_own_profile(text, text) to authenticated;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role_slug = 'admin' and status = 'active'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Admins can read audit log" on public.admin_audit_log;
create policy "Admins can read audit log"
  on public.admin_audit_log for select to authenticated
  using (public.current_user_is_admin());
grant select on public.admin_audit_log to authenticated;

-- Telemetry is private once user management is enabled.
drop policy if exists "Public readings are visible" on public.sensor_readings;
drop policy if exists "Active users can read telemetry" on public.sensor_readings;
create policy "Active users can read telemetry"
  on public.sensor_readings for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and status = 'active'));
revoke select on public.sensor_readings from anon;
grant select on public.sensor_readings to authenticated;

-- Quote confirmations share the atomic cooldown used by other transactional email.
alter table public.email_dispatches drop constraint if exists email_dispatches_kind_check;
alter table public.email_dispatches add constraint email_dispatches_kind_check
  check (kind in ('automatic_alert', 'manual_reading', 'quote_confirmation'));

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
  if p_kind not in ('automatic_alert', 'manual_reading', 'quote_confirmation')
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
  ) then return null; end if;
  insert into public.email_dispatches (kind, recipient_hash, reading_id, status)
  values (p_kind, p_recipient_hash, p_reading_id, 'pending')
  returning id into claimed_id;
  return claimed_id;
end;
$$;

revoke all on function public.claim_email_dispatch(text, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_email_dispatch(text, text, uuid, integer) to service_role;
