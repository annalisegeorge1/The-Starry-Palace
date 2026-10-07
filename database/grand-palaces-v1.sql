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
