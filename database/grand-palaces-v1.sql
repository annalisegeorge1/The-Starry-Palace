-- Grand Palace Constellation · v1 foundation
-- Review-safe DDL: immutable placement, spendable wallet, verified daily contribution,
-- and displayable honours distinct from buy-to-give stock.

create table if not exists public.grand_palaces(
 id smallint primary key check(id between 1 and 10),
 slug text unique not null,
 name text not null,
 motto text not null,
 sigil text not null,
 accent text not null
);
insert into public.grand_palaces(id,slug,name,motto,sigil,accent) values
 (1,'azure-moon','Palace of the Azure Moon','Where quiet brilliance rises.','☾','#8cb8e8'),
 (2,'violet-star','Palace of the Violet Star','Our stories outshine the dark.','✧','#b5a4f2'),
 (3,'sapphire-tide','Palace of the Sapphire Tide','Each wave carries a new world.','≋','#81c1e6'),
 (4,'silver-crane','Palace of the Silver Crane','Elegance in every endeavour.','♧','#b8cadb'),
 (5,'obsidian-rose','Palace of the Obsidian Rose','Beauty is bold in shadow.','❖','#a6a1d8'),
 (6,'celestial-lotus','Palace of the Celestial Lotus','Bloom among the constellations.','✿','#9eced0'),
 (7,'midnight-lantern','Palace of the Midnight Lantern','We keep the light for one another.','♢','#9db4eb'),
 (8,'whispering-comet','Palace of the Whispering Comet','A single spark becomes a universe.','✦','#9da9f5'),
 (9,'amethyst-sky','Palace of the Amethyst Sky','Beyond the horizon, imagination.','◇','#c2ade9'),
 (10,'winter-phoenix','Palace of the Winter Phoenix','We rise through every season.','♛','#a1c8e5')
on conflict(id) do nothing;

create table if not exists public.grand_palace_memberships(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 palace_id smallint not null references public.grand_palaces(id) on delete restrict,
 joined_at timestamptz not null default now()
);
create index if not exists grand_palace_memberships_palace_idx on public.grand_palace_memberships(palace_id);
create table if not exists public.grand_palace_seasons(
 quarter_start date primary key,
 ends_at timestamptz not null,
 status text not null default 'active' check(status in ('active','finalized')),
 winner_id smallint references public.grand_palaces(id),
 finalized_at timestamptz,
 created_at timestamptz not null default now(),
 check(ends_at > quarter_start::timestamptz)
);
create table if not exists public.grand_palace_daily_scores(
 quarter_start date not null references public.grand_palace_seasons(quarter_start),
 day_utc date not null,
 user_id uuid not null references public.profiles(id) on delete cascade,
 palace_id smallint not null references public.grand_palaces(id),
 points integer not null default 0 check(points between 0 and 30),
 primary key(quarter_start,day_utc,user_id)
);
create index if not exists grand_palace_scores_team_idx on public.grand_palace_daily_scores(quarter_start,palace_id);

-- Lifetime Celestial Points remain a permanent achievement metric; spending affects only this wallet.
create table if not exists public.grand_palace_wallets(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 spendable_points bigint not null default 0 check(spendable_points>=0),
 selected_theme text,
 updated_at timestamptz not null default now()
);
create table if not exists public.grand_palace_honours(
 user_id uuid not null references public.profiles(id) on delete cascade,
 honour text not null check(honour in ('heart','star','moon','crown')),
 display_count bigint not null default 0 check(display_count>=0),
 gift_stock bigint not null default 0 check(gift_stock>=0),
 primary key(user_id,honour)
);
create table if not exists public.grand_palace_token_transfers(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 honour text not null check(honour in ('heart','star','moon','crown')),
 note text not null default '' check(char_length(note)<=180),
 created_at timestamptz not null default now(),
 check(sender_id<>recipient_id)
);
create index if not exists grand_palace_transfers_received_idx on public.grand_palace_token_transfers(recipient_id,created_at desc);
create table if not exists public.grand_palace_themes(
 slug text primary key,
 name text not null,
 description text not null
);
insert into public.grand_palace_themes(slug,name,description) values
 ('moonlit-glass','Moonlit Glass','Cool, layered glass and silver moonlight.'),
 ('silver-tide','Silver Tide','Pearl-blue waves against a pale twilight.'),
 ('starlit-veil','Starlit Veil','A night sky traced with delicate stars.'),
 ('violet-dusk','Violet Dusk','Amethyst shadows and soft starlight.'),
 ('sapphire-regalia','Sapphire Regalia','An imperial sapphire chamber with a celestial crown.')
on conflict(slug) do nothing;
create table if not exists public.grand_palace_theme_unlocks(
 user_id uuid not null references public.profiles(id) on delete cascade,
 theme_slug text not null references public.grand_palace_themes(slug),
 source_key text not null,
 unlocked_at timestamptz not null default now(),
 primary key(user_id,theme_slug)
);
alter table public.grand_palace_wallets
  add constraint grand_palace_selected_theme_fkey foreign key(selected_theme) references public.grand_palace_themes(slug);

-- RLS for every newly exposed table. All mutations go through validated server-side functions.
alter table public.grand_palaces enable row level security;
alter table public.grand_palace_memberships enable row level security;
alter table public.grand_palace_seasons enable row level security;
alter table public.grand_palace_daily_scores enable row level security;
alter table public.grand_palace_wallets enable row level security;
alter table public.grand_palace_honours enable row level security;
alter table public.grand_palace_token_transfers enable row level security;
alter table public.grand_palace_themes enable row level security;
alter table public.grand_palace_theme_unlocks enable row level security;
revoke all on public.grand_palaces,public.grand_palace_memberships,public.grand_palace_seasons,
  public.grand_palace_daily_scores,public.grand_palace_wallets,public.grand_palace_honours,
  public.grand_palace_token_transfers,public.grand_palace_themes,public.grand_palace_theme_unlocks
  from anon,authenticated;

create or replace function private.assign_grand_palace(p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_palace smallint;
begin
 if p_user is null then return; end if;
 perform pg_advisory_xact_lock(7040311);
 if exists(select 1 from public.grand_palace_memberships where user_id=p_user) then return; end if;
 select gp.id into v_palace from public.grand_palaces gp
 left join public.grand_palace_memberships gm on gm.palace_id=gp.id
 group by gp.id,gp.slug
 order by count(gm.user_id), md5(p_user::text||gp.slug)
 limit 1;
 if v_palace is null then raise exception 'Grand Palace catalogue is incomplete.'; end if;
 insert into public.grand_palace_memberships(user_id,palace_id)
 values(p_user,v_palace) on conflict(user_id) do nothing;
end $$;
create or replace function private.on_palace_profile_created()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform private.assign_grand_palace(new.id);
 insert into public.grand_palace_wallets(user_id) values(new.id) on conflict(user_id) do nothing;
 return new;
end $$;
drop trigger if exists grand_palace_profile_assignment on public.profiles;
create trigger grand_palace_profile_assignment after insert on public.profiles
for each row execute function private.on_palace_profile_created();

-- Existing members are assigned without rewriting profiles or their previous honours.
do $$
declare v_user uuid;
begin
 for v_user in select id from public.profiles order by created_at,id loop
   perform private.assign_grand_palace(v_user);
 end loop;
end $$;
insert into public.grand_palace_wallets(user_id,spendable_points)
select p.id,coalesce(a.lifetime_points,0) from public.profiles p
left join public.celestial_point_accounts a on a.user_id=p.id
on conflict(user_id) do nothing;

create or replace function private.grand_palace_points_awarded()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_quarter date; v_day date; v_palace smallint; v_end timestamptz;
begin
 -- The spendable balance is credited exactly once, using the authoritative point ledger.
 insert into public.grand_palace_wallets(user_id,spendable_points,updated_at)
 values(new.user_id,new.points,now())
 on conflict(user_id) do update
   set spendable_points=public.grand_palace_wallets.spendable_points+excluded.spendable_points,
       updated_at=now();
 -- Team points represent verified creative participation, not purchased honours,
 -- praise exchanges or prizes, and are capped at 30 points per person per UTC day.
 if new.channel<>'participation' or new.source_kind in ('grand_palace_box','grand_palace_bonus') then
   return new;
 end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=new.user_id;
 if v_palace is null then return new; end if;
 v_quarter:=date_trunc('quarter',new.created_at at time zone 'UTC')::date;
 v_day:=(new.created_at at time zone 'UTC')::date;
 v_end:=(v_quarter::timestamp+interval '3 months') at time zone 'UTC';
 insert into public.grand_palace_seasons(quarter_start,ends_at)
 values(v_quarter,v_end) on conflict(quarter_start) do nothing;
 -- No retroactive team credit after season finalization.
 insert into public.grand_palace_daily_scores(quarter_start,day_utc,user_id,palace_id,points)
 select v_quarter,v_day,new.user_id,v_palace,least(new.points,30)
 where exists(select 1 from public.grand_palace_seasons where quarter_start=v_quarter and status='active')
 on conflict(quarter_start,day_utc,user_id)
 do update set points=least(30,public.grand_palace_daily_scores.points+excluded.points);
 return new;
end $$;
drop trigger if exists grand_palace_point_credit on public.celestial_point_ledger;
create trigger grand_palace_point_credit after insert on public.celestial_point_ledger
for each row execute function private.grand_palace_points_awarded();

insert into public.grand_palace_seasons(quarter_start,ends_at)
values(date_trunc('quarter',now() at time zone 'UTC')::date,
 ((date_trunc('quarter',now() at time zone 'UTC')+interval '3 months') at time zone 'UTC'))
on conflict(quarter_start) do nothing;

revoke all on function private.assign_grand_palace(uuid) from public,anon,authenticated;
revoke all on function private.on_palace_profile_created() from public,anon,authenticated;
revoke all on function private.grand_palace_points_awarded() from public,anon,authenticated;

-- Member-facing RPCs; no direct public table writes are permitted.
create or replace function public.get_grand_palace_identity(p_member uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
   'palace_id', gp.id, 'palace_name',gp.name, 'palace_slug',gp.slug,
   'sigil',gp.sigil, 'accent',gp.accent, 'motto',gp.motto,
   'theme',w.selected_theme,
   'honours',coalesce((select jsonb_object_agg(h.honour,h.display_count)
                       from public.grand_palace_honours h
                       where h.user_id=p.id and h.display_count>0),'{}'::jsonb)
 )
 from public.profiles p
 join public.grand_palace_memberships m on m.user_id=p.id
 join public.grand_palaces gp on gp.id=m.palace_id
 left join public.grand_palace_wallets w on w.user_id=p.id
 where p.id=p_member and (p.visibility<>'hidden' or p.id=auth.uid())
 limit 1
$$;
revoke all on function public.get_grand_palace_identity(uuid) from public,anon,authenticated;
grant execute on function public.get_grand_palace_identity(uuid) to anon,authenticated;

create or replace function public.get_grand_palace_hall()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();
 v_quarter date:=date_trunc('quarter',now() at time zone 'UTC')::date;
 v_end timestamptz:=(date_trunc('quarter',now() at time zone 'UTC')+interval '3 months') at time zone 'UTC';
 v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to enter the Grand Palace Hall.'; end if;
 insert into public.grand_palace_seasons(quarter_start,ends_at)
 values(v_quarter,v_end) on conflict(quarter_start) do nothing;
 select jsonb_build_object(
  'quarter_start',v_quarter,
  'ends_at',v_end,
  'daily_cap',30,
  'palaces',coalesce((
    with member_totals as (
      select palace_id,count(*)::integer as members from public.grand_palace_memberships group by palace_id
    ), team_scores as (
      select palace_id,coalesce(sum(points),0)::bigint as points,
             count(distinct user_id)::integer as contributors,
             count(distinct day_utc)::integer as active_days
      from public.grand_palace_daily_scores where quarter_start=v_quarter group by palace_id
    ), ranked as (
      select gp.id,gp.name,gp.slug,gp.motto,gp.sigil,gp.accent,
        coalesce(m.members,0) as members,coalesce(s.points,0) as points,
        coalesce(s.contributors,0) as contributors,coalesce(s.active_days,0) as active_days,
        round(coalesce(s.points,0)::numeric/greatest(coalesce(m.members,0),1),2) as average_points,
        row_number() over (order by
           (coalesce(s.points,0)::numeric/greatest(coalesce(m.members,0),1)) desc,
           coalesce(s.points,0) desc,gp.id asc) as place
      from public.grand_palaces gp left join member_totals m on m.palace_id=gp.id
       left join team_scores s on s.palace_id=gp.id
    )
    select jsonb_agg(to_jsonb(r) order by r.place) from ranked r
   ),'[]'::jsonb),
  'my_palace_id',(select palace_id from public.grand_palace_memberships where user_id=v_user),
  'my_contribution',(select coalesce(sum(points),0)::bigint from public.grand_palace_daily_scores
       where user_id=v_user and quarter_start=v_quarter),
  'balance',(select coalesce(spendable_points,0) from public.grand_palace_wallets where user_id=v_user),
  'selected_theme',(select selected_theme from public.grand_palace_wallets where user_id=v_user),
  'unlocked_themes',coalesce((select jsonb_agg(jsonb_build_object('slug',t.slug,'name',t.name,'description',t.description) order by t.name)
     from public.grand_palace_theme_unlocks u join public.grand_palace_themes t on t.slug=u.theme_slug where u.user_id=v_user),'[]'::jsonb),
  'honours',coalesce((select jsonb_agg(jsonb_build_object('honour',h.honour,'display_count',h.display_count,'gift_stock',h.gift_stock) order by h.honour)
     from public.grand_palace_honours h where h.user_id=v_user),'[]'::jsonb),
  'past_victories',coalesce((select jsonb_agg(jsonb_build_object('season',s.quarter_start,'palace_id',s.winner_id,'palace_name',gp.name) order by s.quarter_start desc)
     from (select * from public.grand_palace_seasons where status='finalized' and winner_id is not null order by quarter_start desc limit 8)s
     join public.grand_palaces gp on gp.id=s.winner_id),'[]'::jsonb),
  'my_boxes',coalesce((select jsonb_agg(jsonb_build_object(
    'season',a.quarter_start,'award_kind',a.award_kind,'tier',a.box_tier,
    'rank',a.individual_rank,'details',a.details) order by a.quarter_start desc)
    from public.grand_palace_awards a where a.user_id=v_user),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;

create or replace function public.purchase_grand_palace_honour(p_honour text,p_quantity integer default 1)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_cost integer; v_total bigint; v_balance bigint;
begin
 if v_user is null then raise exception 'Sign in to visit the Palace Honour Shop.'; end if;
 v_cost:=case p_honour when 'heart' then 20 when 'star' then 150 when 'moon' then 600 when 'crown' then 3000 else null end;
 if v_cost is null or p_quantity is null or p_quantity<1 or p_quantity>5 then raise exception 'Choose 1–5 recognised honours.'; end if;
 v_total:=v_cost::bigint*p_quantity;
 update public.grand_palace_wallets set spendable_points=spendable_points-v_total,updated_at=now()
 where user_id=v_user and spendable_points>=v_total returning spendable_points into v_balance;
 if not found then raise exception 'Not enough spendable Celestial Points.'; end if;
 insert into public.grand_palace_honours(user_id,honour,gift_stock)
 values(v_user,p_honour,p_quantity)
 on conflict(user_id,honour) do update
 set gift_stock=public.grand_palace_honours.gift_stock+excluded.gift_stock;
 return jsonb_build_object('honour',p_honour,'purchased',p_quantity,'balance',v_balance,'giving_only',true);
end $$;

create or replace function public.send_grand_palace_honour(p_recipient uuid,p_honour text,p_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_note text:=btrim(coalesce(p_note,'')); v_name text;
begin
 if v_user is null then raise exception 'Sign in to send Palace honours.'; end if;
 if p_recipient=v_user or p_recipient is null then raise exception 'Gift an honour to another member.'; end if;
 if p_honour not in ('heart','star','moon','crown') then raise exception 'Unknown Palace honour.'; end if;
 if char_length(v_note)>180 then raise exception 'Keep your gift note within 180 characters.'; end if;
 select username into v_name from public.profiles where id=p_recipient and visibility<>'hidden';
 if v_name is null then raise exception 'This member is not available to receive a Palace gift.'; end if;
 if exists(select 1 from public.user_member_boundaries b
   where ((b.user_id=v_user and b.other_user_id=p_recipient)
       or (b.user_id=p_recipient and b.other_user_id=v_user)) and b.blocked)
 then raise exception 'This exchange is unavailable because of a member boundary.'; end if;
 update public.grand_palace_honours set gift_stock=gift_stock-1
 where user_id=v_user and honour=p_honour and gift_stock>=1;
 if not found then raise exception 'You do not have a giftable token of this type.'; end if;
 insert into public.grand_palace_honours(user_id,honour,display_count)
 values(p_recipient,p_honour,1)
 on conflict(user_id,honour) do update
 set display_count=public.grand_palace_honours.display_count+1;
 insert into public.grand_palace_token_transfers(sender_id,recipient_id,honour,note)
 values(v_user,p_recipient,p_honour,v_note);
 return jsonb_build_object('sent',true,'honour',p_honour,'recipient',v_name);
end $$;

create or replace function public.set_grand_palace_theme(p_theme text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to decorate your chamber.'; end if;
 if p_theme is not null and not exists(
   select 1 from public.grand_palace_theme_unlocks where user_id=v_user and theme_slug=p_theme)
 then raise exception 'This theme has not been unlocked.'; end if;
 update public.grand_palace_wallets set selected_theme=p_theme,updated_at=now()
 where user_id=v_user;
 if not found then raise exception 'Grand Palace wallet not ready.'; end if;
 return true;
end $$;

revoke all on function public.get_grand_palace_hall() from public,anon;
revoke all on function public.purchase_grand_palace_honour(text,integer) from public,anon;
revoke all on function public.send_grand_palace_honour(uuid,text,text) from public,anon;
revoke all on function public.set_grand_palace_theme(text) from public,anon;
grant execute on function public.get_grand_palace_hall() to authenticated;
grant execute on function public.purchase_grand_palace_honour(text,integer) to authenticated;
grant execute on function public.send_grand_palace_honour(uuid,text,text) to authenticated;
grant execute on function public.set_grand_palace_theme(text) to authenticated;

-- One immutable settlement record per member per quarter and award class.
create table if not exists public.grand_palace_awards(
 quarter_start date not null references public.grand_palace_seasons(quarter_start),
 user_id uuid not null references public.profiles(id) on delete cascade,
 award_kind text not null check(award_kind in ('palace_victory','top_ten_box')),
 box_tier text not null check(box_tier in ('bronze','silver','gold','platinum','emerald')),
 individual_rank integer,
 details jsonb not null default '{}'::jsonb,
 awarded_at timestamptz not null default now(),
 primary key(quarter_start,user_id,award_kind)
);
alter table public.grand_palace_awards enable row level security;
revoke all on public.grand_palace_awards from anon,authenticated;

-- Existing Treasury ledger supports a new provenance without creating separate fake gifts.
alter table public.gift_grant_ledger drop constraint if exists gift_grant_ledger_source_type_check;
alter table public.gift_grant_ledger add constraint gift_grant_ledger_source_type_check
 check(source_type in ('lucky_draw','monthly_court','event','achievement','council','system','ink_duel','grand_palace_quarter'));

create or replace function private.add_grand_palace_display_honour(p_user uuid,p_kind text,p_quantity integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_quantity<=0 then return; end if;
 insert into public.grand_palace_honours(user_id,honour,display_count)
 values(p_user,p_kind,p_quantity)
 on conflict(user_id,honour) do update set display_count=public.grand_palace_honours.display_count+excluded.display_count;
end $$;

create or replace function private.grand_palace_grant_gift(
  p_user uuid,p_season date,p_slot text,p_tier text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_gift uuid;
begin
 select g.id into v_gift from public.virtual_gifts g
 where g.reward_eligible=true and g.art_status='final'
 order by md5(p_season::text||p_user::text||p_slot||g.id::text) limit 1;
 if v_gift is null then raise exception 'No finished Palace gift is available for the quarterly reward.'; end if;
 insert into public.gift_grant_ledger(user_id,gift_id,tier,quantity,source_type,source_key,note)
 values(p_user,v_gift,p_tier,1,'grand_palace_quarter',
   'grand-palace:'||p_season::text||':'||p_slot,
   'Grand Palace Constellation quarterly victory reward')
 on conflict(user_id,source_type,source_key) do nothing;
 return v_gift;
end $$;

-- Hourly scheduled settlement means no member needs to press Claim. Rewards are
-- idempotent and awarded based on committed, verified activity and final rankings.
create or replace function private.close_due_grand_palace_seasons()
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_season record;
 v_winner smallint;
 v_rank integer;
 v_member record;
 v_tier text;
 v_theme text;
 v_bonus integer;
 v_hearts integer;
 v_stars integer;
 v_moons integer;
 v_crowns integer;
 v_slots integer;
 v_slot integer;
 v_gift uuid;
 v_gifts jsonb;
 v_finalized integer:=0;
 v_next_quarter date:=date_trunc('quarter',now() at time zone 'UTC')::date;
begin
 perform pg_advisory_xact_lock(7040312);
 insert into public.grand_palace_seasons(quarter_start,ends_at)
 values(v_next_quarter,((v_next_quarter::timestamp+interval '3 months') at time zone 'UTC'))
 on conflict(quarter_start) do nothing;

 for v_season in
   select quarter_start,ends_at,status from public.grand_palace_seasons
   where status='active' and ends_at<=now() order by quarter_start for update
 loop
   -- Comparable score: earned, capped team points divided by the size of each Palace.
   with members as (
     select palace_id,count(*)::numeric as member_count from public.grand_palace_memberships group by palace_id
   ), scores as (
     select palace_id,sum(points)::bigint as total from public.grand_palace_daily_scores
     where quarter_start=v_season.quarter_start group by palace_id
   )
   select gp.id into v_winner
   from public.grand_palaces gp
   join members m on m.palace_id=gp.id
   join scores s on s.palace_id=gp.id
   where s.total>0
   order by s.total::numeric/greatest(m.member_count,1) desc,s.total desc,gp.id asc limit 1;

   if v_winner is not null then
     v_rank:=0;
     for v_member in
       select m.user_id,
           coalesce(sum(d.points),0)::integer as individual_points
       from public.grand_palace_memberships m
       left join public.grand_palace_daily_scores d
         on d.user_id=m.user_id and d.quarter_start=v_season.quarter_start
       where m.palace_id=v_winner and m.joined_at<v_season.ends_at
       group by m.user_id,m.joined_at
       order by individual_points desc,m.joined_at,m.user_id
     loop
       v_rank:=v_rank+1;
       -- All winning members receive at least one finished Bronze treasure.
       v_gift:=private.grand_palace_grant_gift(
            v_member.user_id,v_season.quarter_start,'winning-palace','bronze');
       insert into public.grand_palace_awards(
         quarter_start,user_id,award_kind,box_tier,details)
       values(v_season.quarter_start,v_member.user_id,'palace_victory','bronze',
              jsonb_build_object('gift_id',v_gift,'palace_id',v_winner))
       on conflict(quarter_start,user_id,award_kind) do nothing;
       -- Top ten only for participants who actually contributed this season.
       if v_rank<=10 and v_member.individual_points>0 then
         v_tier:=case when v_rank=1 then 'emerald' when v_rank=2 then 'platinum'
                      when v_rank=3 then 'gold' when v_rank<=5 then 'silver' else 'bronze' end;
         v_bonus:=case when v_rank=1 then 100 when v_rank=2 then 75
                       when v_rank=3 then 55 when v_rank<=5 then 35 else 20 end;
         v_hearts:=case when v_rank=1 then 12 when v_rank=2 then 10 when v_rank=3 then 8
                        when v_rank<=5 then 5 else 3 end;
         v_stars:=case when v_rank=1 then 5 when v_rank=2 then 3 when v_rank=3 then 2
                       when v_rank<=5 then 2 else 1 end;
         v_moons:=case when v_rank<=3 then 1 else 0 end;
         v_crowns:=case when v_rank=1 then 1 else 0 end;
         v_theme:=case when v_rank=1 then 'sapphire-regalia' when v_rank=2 then 'violet-dusk'
                       when v_rank=3 then 'starlit-veil' when v_rank<=5 then 'moonlit-glass'
                       else 'silver-tide' end;
         v_slots:=case when v_rank<=2 then 2 else 1 end;
         v_gifts:='[]'::jsonb;
         for v_slot in 1..v_slots loop
           v_gift:=private.grand_palace_grant_gift(
                v_member.user_id,v_season.quarter_start,'box-'||v_slot::text,v_tier);
           v_gifts:=v_gifts||jsonb_build_array(v_gift);
         end loop;
         perform private.add_grand_palace_display_honour(v_member.user_id,'heart',v_hearts);
         perform private.add_grand_palace_display_honour(v_member.user_id,'star',v_stars);
         perform private.add_grand_palace_display_honour(v_member.user_id,'moon',v_moons);
         perform private.add_grand_palace_display_honour(v_member.user_id,'crown',v_crowns);
         perform private.grant_celestial_points(
           v_member.user_id,v_bonus,'participation','grand_palace_box',
           'grand_palace_box',null,null,
           'grand-palace:'||v_season.quarter_start::text||':box:'||v_member.user_id::text);
         insert into public.grand_palace_theme_unlocks(user_id,theme_slug,source_key)
         values(v_member.user_id,v_theme,'grand-palace:'||v_season.quarter_start::text)
         on conflict(user_id,theme_slug) do nothing;
         insert into public.grand_palace_awards(
           quarter_start,user_id,award_kind,box_tier,individual_rank,details)
         values(v_season.quarter_start,v_member.user_id,'top_ten_box',v_tier,v_rank,
           jsonb_build_object(
             'palace_id',v_winner,'points',v_bonus,'hearts',v_hearts,'stars',v_stars,
             'moons',v_moons,'crowns',v_crowns,'theme',v_theme,'gift_ids',v_gifts))
         on conflict(quarter_start,user_id,award_kind) do nothing;
       end if;
     end loop;
   end if;
   update public.grand_palace_seasons
      set status='finalized',winner_id=v_winner,finalized_at=now()
    where quarter_start=v_season.quarter_start;
   v_finalized:=v_finalized+1;
   v_winner:=null;
 end loop;
 return v_finalized;
end $$;

revoke all on function private.add_grand_palace_display_honour(uuid,text,integer) from public,anon,authenticated;
revoke all on function private.grand_palace_grant_gift(uuid,date,text,text) from public,anon,authenticated;
revoke all on function private.close_due_grand_palace_seasons() from public,anon,authenticated;

-- Cron runs in the database and catches up if a previous hourly run was missed.
-- Schedule separately after this migration has been applied and verified:
-- select cron.schedule('grand-palace-season-settlement','5 * * * *',
--   'select private.close_due_grand_palace_seasons()');
