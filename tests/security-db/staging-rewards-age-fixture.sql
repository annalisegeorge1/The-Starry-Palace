-- STAGING ONLY. Synthetic reward bookkeeping mirrors the RPC-visible fields.
-- This is not a complete production schema and never copies member data.
alter table public.palace_praises
  add column if not exists receiver_id uuid,
  add column if not exists giver_points_awarded integer not null default 0,
  add column if not exists receiver_points_awarded integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists staging_praises_unique
 on public.palace_praises(giver_id,target_kind,target_id);
create table if not exists public.celestial_point_ledger(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 points integer not null,
 channel text not null,
 reason text not null,
 source_kind text not null,
 source_id uuid,
 counterpart_id uuid,
 dedupe_key text not null unique,
 created_at timestamptz not null default now()
);
alter table public.celestial_point_ledger enable row level security;
create or replace function private.grant_celestial_points(
 p_user uuid,p_points integer,p_channel text,p_reason text,
 p_source_kind text,p_source_id uuid,p_counterpart uuid,p_dedupe_key text
) returns integer language plpgsql security definer set search_path to '' as $fn$
declare v_points integer;
begin
 if p_user is null or p_points<=0 then return 0;end if;
 if p_channel not in ('giving','receiving','participation','legacy') then
   raise exception 'Unsupported channel';
 end if;
 insert into public.celestial_point_ledger(user_id,points,channel,reason,source_kind,source_id,counterpart_id,dedupe_key)
 values(p_user,p_points,p_channel,p_reason,p_source_kind,p_source_id,p_counterpart,p_dedupe_key)
 on conflict(dedupe_key) do nothing returning points into v_points;
 return coalesce(v_points,0);
end $fn$;
