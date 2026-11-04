-- Shared abuse prevention and security monitoring for AirSense Edge Functions.

create table if not exists public.api_rate_limits (
  bucket text not null check (char_length(bucket) between 1 and 80),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0),
  updated_at timestamptz not null default now(),
  primary key (bucket, key_hash)
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;

create or replace function public.claim_api_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_max_hits integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.api_rate_limits;
begin
  if char_length(coalesce(p_bucket, '')) not between 1 and 80
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_max_hits not between 1 and 10000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_bucket || ':' || p_key_hash));
  select * into current_row
  from public.api_rate_limits
  where bucket = p_bucket and key_hash = p_key_hash;

  if current_row.bucket is null
    or current_row.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    insert into public.api_rate_limits (bucket, key_hash, window_started_at, hits, updated_at)
    values (p_bucket, p_key_hash, now(), 1, now())
    on conflict (bucket, key_hash) do update
      set window_started_at = excluded.window_started_at,
          hits = 1,
          updated_at = now();
    return true;
  end if;

  if current_row.hits >= p_max_hits then return false; end if;
  update public.api_rate_limits
  set hits = hits + 1, updated_at = now()
  where bucket = p_bucket and key_hash = p_key_hash;
  return true;
end;
$$;

revoke all on function public.claim_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_api_rate_limit(text, text, integer, integer) to service_role;

create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null check (char_length(event_type) between 1 and 80),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  actor_id uuid references auth.users(id) on delete set null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists security_events_occurred_idx
  on public.security_events (occurred_at desc);
create index if not exists security_events_actor_idx
  on public.security_events (actor_id, occurred_at desc);

alter table public.security_events enable row level security;
revoke all on public.security_events from public, anon, authenticated;
grant insert on public.security_events to service_role;

drop policy if exists "Admins can read security events" on public.security_events;
create policy "Admins can read security events"
  on public.security_events for select to authenticated
  using (public.current_user_is_admin());
grant select on public.security_events to authenticated;

comment on table public.security_events is
  'Security events contain hashes and metadata only; never raw tokens, passwords, API keys, or IP addresses.';
