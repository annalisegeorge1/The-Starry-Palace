-- Palace Visit Constellation: a real authenticated visit per UTC date.
-- Repeated refreshes never add a day; no rewards count toward the quarterly palace race.
create table if not exists public.palace_login_progress(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 last_day date,
 streak_days integer not null default 0 check(streak_days between 0 and 6),
 completed_weeks integer not null default 0 check(completed_weeks>=0),
 awarded_prizes integer not null default 0 check(awarded_prizes>=0),
 updated_at timestamptz not null default now()
);
alter table public.palace_login_progress enable row level security;
revoke all on public.palace_login_progress from public,anon,authenticated;
grant select on public.palace_login_progress to authenticated;
drop policy if exists "members view their visit streak" on public.palace_login_progress;
create policy "members view their visit streak" on public.palace_login_progress
 for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.get_palace_login_progress()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.palace_login_progress%rowtype; v_today date:=(now() at time zone 'UTC')::date;
begin
 if v_user is null then raise exception 'Sign in to see your constellation streak.'; end if;
 select * into v_row from public.palace_login_progress where user_id=v_user;
 return jsonb_build_object(
  'today_logged',coalesce(v_row.last_day=v_today,false),
  'streak_days',case when v_row.last_day>=v_today-1 then coalesce(v_row.streak_days,0) else 0 end,
  'completed_weeks',coalesce(v_row.completed_weeks,0),
  'prizes_earned',coalesce(v_row.awarded_prizes,0),
  'weeks_until_prize',4-mod(coalesce(v_row.completed_weeks,0),4),
  'reward_per_week',175,'days_per_week',7,'utc_today',v_today
 );
end $$;

create or replace function public.record_palace_visit()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();
 v_today date:=(now() at time zone 'UTC')::date;
 v_row public.palace_login_progress%rowtype;
 v_days integer; v_weeks integer; v_prizes integer;
 v_points integer:=0; v_gift uuid; v_gift_name text; v_prize_no integer;
begin
 if v_user is null then raise exception 'Sign in to count your Palace visit.'; end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),932701);
 if not exists(select 1 from public.profiles where id=v_user) then
   raise exception 'Complete your Palace account setup before counting visits.';
 end if;
 insert into public.palace_login_progress(user_id) values(v_user)
 on conflict(user_id) do nothing;
 select * into v_row from public.palace_login_progress where user_id=v_user for update;
 if v_row.last_day=v_today then return public.get_palace_login_progress(); end if;
 if v_row.last_day=v_today-1 then v_days:=v_row.streak_days+1;
 else v_days:=1; end if;
 v_weeks:=v_row.completed_weeks; v_prizes:=v_row.awarded_prizes;
 if v_days>=7 then
  v_days:=0;
  v_weeks:=v_weeks+1;
  v_points:=private.grant_celestial_points(v_user,175,'legacy',
   'seven_day_palace_login','palace_login_streak',null,null,
   'palace:login:week:'||v_user::text||':'||v_weeks::text);
  if mod(v_weeks,4)=0 then
    v_prize_no:=v_weeks/4;
    select g.id,g.name into v_gift,v_gift_name from public.virtual_gifts g
    where g.reward_eligible=true and g.art_status='final'
    order by case when exists(
     select 1 from public.user_gift_inventory inv
      where inv.user_id=v_user and inv.gift_id=g.id) then 1 else 0 end,
     md5(v_user::text||v_prize_no::text||g.id::text)
    limit 1;
    if v_gift is null then raise exception 'The Treasury cannot supply the completed streak prize yet.'; end if;
    insert into public.gift_grant_ledger
      (user_id,gift_id,tier,quantity,source_type,source_key,note)
    values(v_user,v_gift,'gold',1,'palace_login_streak',
       'four-weeks:'||v_prize_no,
       'Starwatcher gift · four completed seven-day login streaks')
    on conflict(user_id,source_type,source_key) do nothing;
    v_prizes:=v_prize_no;
  end if;
 end if;
 update public.palace_login_progress set
  last_day=v_today,streak_days=v_days,completed_weeks=v_weeks,
  awarded_prizes=v_prizes,updated_at=now() where user_id=v_user;
 return public.get_palace_login_progress()||jsonb_build_object(
   'points_earned_today',v_points,'gift_earned_today',v_gift_name);
end $$;
revoke all on function public.get_palace_login_progress() from public,anon;
revoke all on function public.record_palace_visit() from public,anon;
grant execute on function public.get_palace_login_progress() to authenticated;
grant execute on function public.record_palace_visit() to authenticated;
