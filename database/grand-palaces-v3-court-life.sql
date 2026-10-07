-- Grand Palace Court Life v3 · verified daily rituals and privacy-conscious court roll
-- Members retain permanent placement. Rivalries/festivals are presentation-only;
-- only one earned ritual contributes five points per member per UTC day.

create table public.grand_palace_daily_rituals(
 user_id uuid not null references public.profiles(id) on delete cascade,
 day_utc date not null,
 palace_id smallint not null references public.grand_palaces(id),
 post_id uuid not null unique references public.grand_palace_common_posts(id) on delete cascade,
 response_hash text not null,
 points integer not null default 5 check(points=5),
 created_at timestamptz not null default now(),
 primary key(user_id,day_utc),
 unique(user_id,response_hash)
);
create index grand_palace_daily_rituals_palace_idx on public.grand_palace_daily_rituals(palace_id,day_utc desc);
alter table public.grand_palace_daily_rituals enable row level security;
revoke all on public.grand_palace_daily_rituals from public,anon,authenticated;

create or replace function public.submit_grand_palace_daily_ritual(p_body text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();
 v_body text:=btrim(coalesce(p_body,''));
 v_palace smallint;
 v_day date:=(now() at time zone 'UTC')::date;
 v_today integer;
 v_hash text;
 v_post uuid;
 v_points integer;
 v_word_count integer;
begin
 if v_user is null then raise exception 'Sign in to join your Grand Palace ritual.'; end if;
 v_word_count:=coalesce(array_length(regexp_split_to_array(v_body,'\s+'),1),0);
 if char_length(v_body)<75 or v_word_count<8 or char_length(v_body)>1000 then
   raise exception 'Write a creative response of 75–1,000 characters and at least eight words.';
 end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),7040313);
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Your Grand Palace membership is unavailable.'; end if;
 if exists(select 1 from public.grand_palace_daily_rituals
           where user_id=v_user and day_utc=v_day)
 then raise exception 'You have already completed today’s Grand Palace ritual.'; end if;
 select count(*)::integer into v_today
 from public.grand_palace_common_posts
 where author_id=v_user and (created_at at time zone 'UTC')::date=v_day;
 if v_today>=5 then raise exception 'You have reached five common-room posts today.'; end if;
 -- Cosmetic changes and reposting an earlier ritual never generate extra points.
 v_hash:=md5(lower(regexp_replace(v_body,'[[:space:][:punct:]]+','','g')));
 if exists(select 1 from public.grand_palace_daily_rituals
           where user_id=v_user and response_hash=v_hash)
 then raise exception 'This response has already earned ritual points. Share a new creation.'; end if;
 insert into public.grand_palace_common_posts(palace_id,author_id,body,kind)
 values(v_palace,v_user,v_body,'quest') returning id into v_post;
 insert into public.grand_palace_daily_rituals(user_id,day_utc,palace_id,post_id,response_hash)
 values(v_user,v_day,v_palace,v_post,v_hash);
 v_points:=private.grant_celestial_points(
   v_user,5,'participation','grand_palace_daily_ritual',
   'grand_palace_ritual',v_post,null,
   'grand-palace:ritual:'||v_day::text||':'||v_user::text
 );
 return jsonb_build_object('completed',true,'post_id',v_post,
   'earned_points',v_points,'day_utc',v_day,'palace_id',v_palace);
end $$;

create or replace function public.get_grand_palace_court_status()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();
 v_palace smallint;
 v_quarter date:=date_trunc('quarter',now() at time zone 'UTC')::date;
 v_day date:=(now() at time zone 'UTC')::date;
 v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to see your Grand Palace court.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'This account has no Grand Palace membership.'; end if;
 select jsonb_build_object(
  'palace_id',v_palace,
  'ritual_completed_today',exists(select 1 from public.grand_palace_daily_rituals
                                  where user_id=v_user and day_utc=v_day),
  'my_rituals_this_quarter',(select count(*) from public.grand_palace_daily_rituals r
        where user_id=v_user and day_utc>=v_quarter and day_utc<=v_day),
  'court_rituals_this_quarter',(select count(*) from public.grand_palace_daily_rituals r
        where palace_id=v_palace and day_utc>=v_quarter and day_utc<=v_day),
  'my_ritual_streak',(
     with days as (
       select v_day-generate_series(0,89) as date_value
     ), marked as (
       select days.date_value,row_number() over(order by days.date_value desc) as seq
       from days
       join public.grand_palace_daily_rituals r
         on r.user_id=v_user and r.day_utc=days.date_value
     )
     select coalesce(count(*),0)::integer from marked
       where date_value=v_day-(seq::integer-1)
  ),
  'court_members',coalesce((
     select jsonb_agg(to_jsonb(t) order by t.season_points desc,t.display_name)
     from(
       select p.username,p.display_name,p.avatar_url,
         coalesce(s.season_points,0) as season_points
       from public.grand_palace_memberships m
       join public.profiles p on p.id=m.user_id
       left join lateral (
         select sum(d.points)::integer as season_points
         from public.grand_palace_daily_scores d
         where d.user_id=m.user_id and d.quarter_start=v_quarter
       )s on true
       where m.palace_id=v_palace and (p.visibility='public' or p.id=v_user)
       order by season_points desc,p.display_name
       limit 12
     )t
   ),'[]'::jsonb),
  'quarter_start',v_quarter
 ) into v_result;
 return v_result;
end $$;
revoke all on function public.submit_grand_palace_daily_ritual(text) from public,anon;
revoke all on function public.get_grand_palace_court_status() from public,anon;
grant execute on function public.submit_grand_palace_daily_ritual(text) to authenticated;
grant execute on function public.get_grand_palace_court_status() to authenticated;
