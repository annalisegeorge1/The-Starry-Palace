-- Court Celebrations · verified milestones and permanent victories
-- Read-only feed for members of each court; all writes are private/server-side.
create table if not exists public.grand_palace_celebrations(
 id uuid primary key default gen_random_uuid(),
 event_key text not null unique,
 palace_id smallint not null references public.grand_palaces(id),
 quarter_start date not null references public.grand_palace_seasons(quarter_start),
 event_kind text not null check(event_kind in ('standard_raised','season_victory')),
 stage text check(stage in ('awakened','starlit','regal','sovereign')),
 milestone_points integer,
 headline text not null,
 message text not null,
 created_at timestamptz not null default now(),
 check(
  (event_kind='standard_raised' and stage is not null and milestone_points is not null)
  or (event_kind='season_victory' and stage is null and milestone_points is null)
 )
);
create index if not exists grand_palace_celebrations_feed_idx
 on public.grand_palace_celebrations(palace_id,created_at desc);
create table if not exists public.grand_palace_celebration_views(
 user_id uuid not null references public.profiles(id) on delete cascade,
 celebration_id uuid not null references public.grand_palace_celebrations(id) on delete cascade,
 seen_at timestamptz not null default now(),
 primary key(user_id,celebration_id)
);
alter table public.grand_palace_celebrations enable row level security;
alter table public.grand_palace_celebration_views enable row level security;
revoke all on public.grand_palace_celebrations,public.grand_palace_celebration_views from anon,authenticated;

-- This job inspects verified ledger-derived daily scores, never client-supplied scores.
-- A milestone may only be created once per quarter and Palace. Previous celebrations
-- remain in the archive after a new quarter starts.
create or replace function private.refresh_grand_palace_celebrations()
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_row record;
 v_stage record;
 v_count integer:=0;
 v_inserted integer;
 v_headline text;
 v_message text;
begin
 perform pg_advisory_xact_lock(7040316);
 for v_row in
  select s.quarter_start,s.status,g.id as palace_id,g.name,
   coalesce(d.points,0)::bigint as points,
   coalesce(m.member_count,0)::integer as members,
   coalesce(d.points,0)::numeric / greatest(coalesce(m.member_count,0),1) as average_points
  from public.grand_palace_seasons s
  cross join public.grand_palaces g
  join lateral (
    select count(*)::integer as member_count
    from public.grand_palace_memberships where palace_id=g.id
  )m on m.member_count>0
  left join lateral (
    select coalesce(sum(points),0)::bigint as points
    from public.grand_palace_daily_scores
    where quarter_start=s.quarter_start and palace_id=g.id
  )d on true
  where s.quarter_start >= (date_trunc('quarter',(now() at time zone 'UTC')-interval '6 months'))::date
    and s.status in ('active','finalized')
 loop
   if v_row.points <= 0 then continue; end if;
   for v_stage in
     select * from (values
       (25,'awakened','The court awakens','The first silver sparks illuminate the court standard.'),
       (150,'starlit','A constellation is born','New stars have gathered around the Palace crest.'),
       (500,'regal','The royal standard rises','The court has earned its silver regalia.'),
       (1500,'sovereign','The sovereign sky unfolds','The Palace has illuminated its highest ceremonial standard.')
     ) as t(threshold,slug,title,description)
     where v_row.average_points >= t.threshold
   loop
     insert into public.grand_palace_celebrations(
       event_key,palace_id,quarter_start,event_kind,stage,milestone_points,headline,message)
     values(
       'standard:'||v_row.quarter_start::text||':'||v_row.palace_id::text||':'||v_stage.slug,
       v_row.palace_id,v_row.quarter_start,'standard_raised',v_stage.slug,v_stage.threshold,
       v_stage.title,
       v_row.name||' has reached a new milestone. '||v_stage.description||
       ' Every verified contribution helped write this moment.')
     on conflict(event_key) do nothing;
     get diagnostics v_inserted=row_count;
     v_count:=v_count+v_inserted;
   end loop;
 end loop;

 -- Only officially finalized winning courts can receive victory celebrations.
 for v_row in
   select s.quarter_start,s.winner_id as palace_id,g.name
   from public.grand_palace_seasons s
   join public.grand_palaces g on g.id=s.winner_id
   where s.status='finalized' and s.winner_id is not null
     and s.quarter_start >= (date_trunc('quarter',(now() at time zone 'UTC')-interval '6 months'))::date
 loop
   insert into public.grand_palace_celebrations(
     event_key,palace_id,quarter_start,event_kind,headline,message)
   values(
     'victory:'||v_row.quarter_start::text||':'||v_row.palace_id::text,
     v_row.palace_id,v_row.quarter_start,'season_victory',
     'A Palace has claimed the constellation!',
     v_row.name||' has officially won the quarterly Grand Palace competition.'||
     ' Its victory star will remain in the Royal Archives for future generations.')
   on conflict(event_key) do nothing;
   get diagnostics v_inserted=row_count;
   v_count:=v_count+v_inserted;
 end loop;
 return v_count;
end $$;

create or replace function public.get_grand_palace_celebrations()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 v_member uuid:=auth.uid();
 v_palace smallint;
 v_feed jsonb;
begin
 if v_member is null then raise exception 'Sign in to visit your Palace celebrations.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships
 where user_id=v_member;
 if v_palace is null then raise exception 'Your Grand Palace membership is unavailable.'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',e.id,'kind',e.event_kind,'stage',e.stage,
   'headline',e.headline,'message',e.message,'season',e.quarter_start,
   'milestone_points',e.milestone_points,'created_at',e.created_at,
   'seen',v.seen_at is not null) order by e.created_at desc,e.id desc),'[]'::jsonb)
 into v_feed from (
   select id,event_kind,stage,headline,message,quarter_start,milestone_points,created_at
   from public.grand_palace_celebrations
   where palace_id=v_palace and created_at >= now()-interval '365 days'
   order by created_at desc,id desc limit 20
 )e left join public.grand_palace_celebration_views v
   on v.celebration_id=e.id and v.user_id=v_member;
 return jsonb_build_object('palace_id',v_palace,'events',v_feed);
end $$;

create or replace function public.acknowledge_grand_palace_celebration(p_event_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_member uuid:=auth.uid();v_palace smallint;
begin
 if v_member is null then raise exception 'Sign in to save your celebration.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_member;
 if not exists(select 1 from public.grand_palace_celebrations
   where id=p_event_id and palace_id=v_palace)
 then raise exception 'This celebration is not available in your Palace.'; end if;
 insert into public.grand_palace_celebration_views(user_id,celebration_id)
 values(v_member,p_event_id)
 on conflict(user_id,celebration_id) do nothing;
 return true;
end $$;

revoke all on function private.refresh_grand_palace_celebrations() from public,anon,authenticated;
revoke all on function public.get_grand_palace_celebrations() from public,anon;
revoke all on function public.acknowledge_grand_palace_celebration(uuid) from public,anon;
grant execute on function public.get_grand_palace_celebrations() to authenticated;
grant execute on function public.acknowledge_grand_palace_celebration(uuid) to authenticated;

-- Run once for already-earned milestones; no gifts or points are ever issued here.
select private.refresh_grand_palace_celebrations();
