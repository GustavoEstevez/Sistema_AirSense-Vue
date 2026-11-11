-- Read-only summary: at most 24 time buckets * 10 actual readings = 240 points.
-- Keep the first/last reading and each metric's minimum/maximum per bucket.
-- SECURITY INVOKER preserves the caller's telemetry RLS policies.
create or replace function public.get_reading_history_summary(
  p_device_id text,
  p_from timestamptz default null,
  p_to timestamptz default now()
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  summary jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  ) or not public.current_user_can_access_device(p_device_id) then
    raise exception 'Station access denied' using errcode = '42501';
  end if;
  if p_device_id is null or char_length(p_device_id) not between 1 and 80
    or p_to is null or (p_from is not null and p_from > p_to) then
    raise exception 'Invalid history period' using errcode = '22023';
  end if;

  with filtered as materialized (
    select id, device_id, temperature, humidity, noise, co2, recorded_at
    from public.sensor_readings
    where device_id = p_device_id
      and (p_from is null or recorded_at >= p_from)
      and recorded_at <= p_to
  ), bounds as (
    select count(*) as total_count, min(recorded_at) as first_at, max(recorded_at) as last_at
    from filtered
  ), bucketed as (
    select f.*, least(23, floor(
      extract(epoch from (f.recorded_at - b.first_at)) * 24
      / nullif(extract(epoch from (b.last_at - b.first_at)), 0)
    ))::integer as bucket
    from filtered f cross join bounds b
  ), ranked as (
    select *,
      row_number() over (partition by bucket order by recorded_at, id) as first_rank,
      row_number() over (partition by bucket order by recorded_at desc, id desc) as last_rank,
      row_number() over (partition by bucket order by temperature asc nulls last, recorded_at, id) as t_min,
      row_number() over (partition by bucket order by temperature desc nulls last, recorded_at, id) as t_max,
      row_number() over (partition by bucket order by humidity asc nulls last, recorded_at, id) as h_min,
      row_number() over (partition by bucket order by humidity desc nulls last, recorded_at, id) as h_max,
      row_number() over (partition by bucket order by noise asc nulls last, recorded_at, id) as n_min,
      row_number() over (partition by bucket order by noise desc nulls last, recorded_at, id) as n_max,
      row_number() over (partition by bucket order by co2 asc nulls last, recorded_at, id) as c_min,
      row_number() over (partition by bucket order by co2 desc nulls last, recorded_at, id) as c_max
    from bucketed
  ), points as (
    select id, device_id, temperature, humidity, noise, co2, recorded_at
    from ranked
    where first_rank = 1 or last_rank = 1
      or t_min = 1 or t_max = 1 or h_min = 1 or h_max = 1
      or n_min = 1 or n_max = 1 or c_min = 1 or c_max = 1
      or (select total_count from bounds) <= 240
  )
  select jsonb_build_object(
    'total_count', b.total_count,
    'bucket_count', 24,
    'points', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.recorded_at, p.id) from points p
    ), '[]'::jsonb)
  ) into summary from bounds b;
  return summary;
end;
$$;

revoke all on function public.get_reading_history_summary(text, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_reading_history_summary(text, timestamptz, timestamptz) to authenticated;
