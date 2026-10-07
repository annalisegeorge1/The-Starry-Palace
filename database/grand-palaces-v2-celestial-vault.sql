-- Grand Palace Common Rooms + Celestial Sovereign Vault · migration v2
-- Lives on top of grand-palaces-v1. Server-side transactions enforce the rules.
create table public.grand_palace_common_posts(
 id uuid primary key default gen_random_uuid(),
 palace_id smallint not null references public.grand_palaces(id),
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 10 and 1000),
 kind text not null default 'message' check(kind in ('message','introduction','quest')),
 created_at timestamptz not null default now(),
 removed_at timestamptz
);
create index grand_palace_common_posts_feed_idx on public.grand_palace_common_posts(palace_id,created_at desc);
create index grand_palace_common_posts_author_idx on public.grand_palace_common_posts(author_id,created_at desc);
alter table public.grand_palace_common_posts enable row level security;
revoke all on public.grand_palace_common_posts from public,anon,authenticated;

create table public.grand_palace_celestial_badge_requirements(
 achievement_id uuid primary key references public.achievement_families(id) on delete restrict,
 frozen_at timestamptz not null default now()
);
insert into public.grand_palace_celestial_badge_requirements(achievement_id)
select id from public.achievement_families where active=true and thresholds ? 'emerald';
alter table public.grand_palace_celestial_badge_requirements enable row level security;
revoke all on public.grand_palace_celestial_badge_requirements from public,anon,authenticated;

create table public.grand_palace_celestial_draws(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_key uuid not null,
 day_utc date not null default (now() at time zone 'UTC')::date,
 spent_points integer not null default 1 check(spent_points=1),
 roll integer not null check(roll between 1 and 1000000),
 won boolean not null default false,
 created_at timestamptz not null default now(),
 unique(user_id,request_key)
);
create index grand_palace_celestial_draws_daily_idx on public.grand_palace_celestial_draws(user_id,day_utc);
alter table public.grand_palace_celestial_draws enable row level security;
revoke all on public.grand_palace_celestial_draws from public,anon,authenticated;

create table public.grand_palace_celestial_awards(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 source text not null check(source in ('lottery','badge_grandmaster')),
 source_key text not null,
 gift_id uuid not null references public.virtual_gifts(id),
 theme_slug text not null,
 awarded_at timestamptz not null default now(),
 unique(user_id,source,source_key)
);
create index grand_palace_celestial_awards_owner_idx on public.grand_palace_celestial_awards(user_id,awarded_at desc);
alter table public.grand_palace_celestial_awards enable row level security;
revoke all on public.grand_palace_celestial_awards from public,anon,authenticated;

insert into public.grand_palace_themes(slug,name,description)
values('celestial-sovereign','Celestial Sovereign','A once-in-an-age astral chamber crowned in sapphire and moonlight.')
on conflict(slug) do nothing;

alter table public.gift_grant_ledger drop constraint if exists gift_grant_ledger_source_type_check;
alter table public.gift_grant_ledger add constraint gift_grant_ledger_source_type_check
check(source_type in ('lucky_draw','monthly_court','event','achievement','council','system',
 'ink_duel','grand_palace_quarter','celestial_vault'));

create or replace function private.grand_palace_celestial_award(
 p_user uuid,p_source text,p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_gift uuid; v_ent uuid:=gen_random_uuid();
begin
 if p_user is null or p_source not in ('lottery','badge_grandmaster') or btrim(coalesce(p_key,''))=''
 then raise exception 'Invalid Celestial Vault award.'; end if;
 if exists(select 1 from public.grand_palace_celestial_awards
     where user_id=p_user and source=p_source and source_key=p_key)
 then raise exception 'This Celestial Box has already been awarded.'; end if;
 -- Server-only entropy prevents selecting the reward via a caller-chosen key.
 select id into v_gift from public.virtual_gifts
 where reward_eligible=true and art_status='final'
 order by md5(v_ent::text||id::text) limit 1;
 if v_gift is null then raise exception 'The Celestial Vault has no finished Treasury gifts.'; end if;
 insert into public.grand_palace_celestial_awards(user_id,source,source_key,gift_id,theme_slug)
 values(p_user,p_source,p_key,v_gift,'celestial-sovereign');
 insert into public.gift_grant_ledger(user_id,gift_id,tier,quantity,source_type,source_key,note)
 values(p_user,v_gift,'emerald',1,'celestial_vault',p_source||':'||p_key,'Celestial Sovereign Box · '||p_source);
 perform private.add_grand_palace_display_honour(p_user,'heart',30);
 perform private.add_grand_palace_display_honour(p_user,'star',12);
 perform private.add_grand_palace_display_honour(p_user,'moon',3);
 perform private.add_grand_palace_display_honour(p_user,'crown',1);
 insert into public.grand_palace_theme_unlocks(user_id,theme_slug,source_key)
 values(p_user,'celestial-sovereign','celestial:'||p_source||':'||p_key)
 on conflict(user_id,theme_slug) do nothing;
 -- A legacy-channel grant grows lifetime and spendable balances, but never team standings.
 perform private.grant_celestial_points(
 p_user,500,'legacy','celestial_sovereign_box','celestial_vault',null,null,
 'celestial:points:'||p_source||':'||p_user::text||':'||p_key);
 return jsonb_build_object('won',true,'name','Celestial Sovereign Box',
   'tier','celestial','gift_id',v_gift,'theme','celestial-sovereign',
   'points',500,'hearts',30,'stars',12,'moons',3,'crowns',1,'source',p_source);
end $$;

create or replace function public.enter_celestial_vault(p_request_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();v_wallet bigint;v_day date:=(now() at time zone 'UTC')::date;
 v_tries integer;v_num bigint;v_bytes bytea;v_roll integer;v_won boolean;v_old record;v_box jsonb;
begin
 if v_user is null then raise exception 'Sign in to enter the Celestial Vault.'; end if;
 if p_request_key is null then raise exception 'An entry key is required to protect your point balance.'; end if;
 -- Lock wallet first: concurrent requests cannot bypass the three-entry limit
 -- or spend the same point twice.
 select spendable_points into v_wallet from public.grand_palace_wallets
 where user_id=v_user for update;
 if not found then raise exception 'Your Palace wallet is not ready.'; end if;
 select id,roll,won into v_old from public.grand_palace_celestial_draws
 where user_id=v_user and request_key=p_request_key;
 if found then return jsonb_build_object('entry_id',v_old.id,'won',v_old.won,
   'roll',v_old.roll,'cost',1,'already_processed',true); end if;
 select count(*)::integer into v_tries from public.grand_palace_celestial_draws
 where user_id=v_user and day_utc=v_day;
 if v_tries>=3 then raise exception 'Three daily entries have been used. The Vault reopens tomorrow (UTC).'; end if;
 if v_wallet<1 then raise exception 'You need one spendable Celestial Point for this entry.'; end if;
 -- Unbiased sample from 32 bits of PostgreSQL pgcrypto CSPRNG.
 loop
  v_bytes:=extensions.gen_random_bytes(4);
  v_num:=get_byte(v_bytes,0)::bigint*16777216+
    get_byte(v_bytes,1)::bigint*65536+
    get_byte(v_bytes,2)::bigint*256+get_byte(v_bytes,3)::bigint;
  exit when v_num<4294000000;
 end loop;
 v_roll:=(v_num%1000000)::integer+1;
 v_won:=(v_roll=1);
 update public.grand_palace_wallets
 set spendable_points=spendable_points-1,updated_at=now() where user_id=v_user;
 insert into public.grand_palace_celestial_draws(user_id,request_key,day_utc,roll,won)
 values(v_user,p_request_key,v_day,v_roll,v_won)
 returning id into v_old;
 if v_won then
  v_box:=private.grand_palace_celestial_award(v_user,'lottery',v_old.id::text);
 end if;
 return jsonb_build_object('entry_id',v_old.id,'won',v_won,'roll',v_roll,
   'cost',1,'chance_denominator',1000000,'remaining_today',2-v_tries,
   'box',v_box,'balance',case when v_won then v_wallet-1+500 else v_wallet-1 end);
end $$;

create or replace function public.claim_celestial_badge_grandmaster()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_total integer;v_complete integer;v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to claim badge mastery.'; end if;
 -- Lock this member's wallet to serialize retries and the one-off claim.
 perform 1 from public.grand_palace_wallets where user_id=v_user for update;
 if not found then raise exception 'Your Palace membership is not ready.'; end if;
 if exists(select 1 from public.grand_palace_celestial_awards
     where user_id=v_user and source='badge_grandmaster')
 then raise exception 'Your Badge Grandmaster Celestial Box was already awarded.'; end if;
 select count(*)::integer, count(p.achievement_id)::integer
 into v_total,v_complete
 from public.grand_palace_celestial_badge_requirements r
 left join public.user_achievement_progress p
   on p.achievement_id=r.achievement_id and p.user_id=v_user
   and p.emerald_unlocked_at is not null;
 if v_total=0 or v_complete<v_total then
  raise exception 'Reach Emerald for every founding badge family (% of % complete).',v_complete,v_total;
 end if;
 v_result:=private.grand_palace_celestial_award(v_user,'badge_grandmaster','founding-collection-v1');
 return v_result||jsonb_build_object('badges_completed',v_complete,'badges_required',v_total);
end $$;

create or replace function public.get_celestial_vault_status()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_result jsonb;
begin
 if v_user is null then raise exception 'Sign in to view the Celestial Vault.'; end if;
 select jsonb_build_object(
 'cost',1,'chance_denominator',1000000,'daily_cap',3,
 'entries_today',(select count(*) from public.grand_palace_celestial_draws d
     where d.user_id=v_user and d.day_utc=(now() at time zone 'UTC')::date),
 'lifetime_entries',(select count(*) from public.grand_palace_celestial_draws d where d.user_id=v_user),
 'lottery_wins',(select count(*) from public.grand_palace_celestial_awards a where a.user_id=v_user and a.source='lottery'),
 'badge_required',(select count(*) from public.grand_palace_celestial_badge_requirements),
 'badge_completed',(select count(*) from public.grand_palace_celestial_badge_requirements r
     join public.user_achievement_progress p on p.achievement_id=r.achievement_id
     where p.user_id=v_user and p.emerald_unlocked_at is not null),
 'badge_claimed',exists(select 1 from public.grand_palace_celestial_awards a where a.user_id=v_user and a.source='badge_grandmaster'),
 'missing_badges',coalesce((select jsonb_agg(x.name order by x.name) from (
     select f.name from public.grand_palace_celestial_badge_requirements r
      join public.achievement_families f on f.id=r.achievement_id
      left join public.user_achievement_progress p on p.achievement_id=r.achievement_id
        and p.user_id=v_user
      where p.emerald_unlocked_at is null order by f.name limit 6)x),'[]'::jsonb),
 'past_awards',coalesce((select jsonb_agg(jsonb_build_object('source',a.source,'gift_id',a.gift_id,
     'awarded_at',a.awarded_at) order by a.awarded_at desc)
     from public.grand_palace_celestial_awards a where a.user_id=v_user),'[]'::jsonb),
 'balance',(select spendable_points from public.grand_palace_wallets where user_id=v_user)
 ) into v_result;
 return v_result;
end $$;

-- Read and write the common room only through authenticated RPCs.
create or replace function public.get_grand_palace_common_room()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_day date:=(now() at time zone 'UTC')::date;
 v_result jsonb;v_question text;
begin
 if v_user is null then raise exception 'Sign in to your Grand Palace common room.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Your Palace membership is being prepared.'; end if;
 v_question:=(array[
   'Describe a world using only five sensory details.',
   'Write three lines about a place you have never seen.',
   'Share the opening sentence of a story that does not exist yet.',
   'Make an ordinary object seem enchanted in two sentences.',
   'Describe a character through their greatest fear.',
   'Leave your Palace a six-word poem.',
   'Reimagine a familiar myth through another character’s eyes.',
   'Invent a poetic name for a constellation.',
   'Write the shortest possible scene containing a betrayal.',
   'Describe a painting without mentioning its colours.',
   'What would the moon write in a letter to the sea?',
   'Share one detail of a story you are working on.',
   'Describe a doorway leading somewhere impossible.',
   'Write a dialogue exchange without naming either speaker.'
  ])[1+(v_day-date '2026-01-01')%14];
 select jsonb_build_object(
   'palace_id',v_palace,'day_utc',v_day,'quest',v_question,
   'quest_completed',(select exists(select 1 from public.grand_palace_daily_scores d
     where d.user_id=v_user and d.day_utc=v_day and d.points>0)),
   'message_count_today',(select count(*) from public.grand_palace_common_posts x
     where x.author_id=v_user and (x.created_at at time zone 'UTC')::date=v_day),
   'messages',coalesce((select jsonb_agg(jsonb_build_object(
     'id',x.id,'body',x.body,'kind',x.kind,'created_at',x.created_at,
     'is_mine',x.author_id=v_user,'author_name',p.display_name,
     'author_handle',p.username,'avatar_url',p.avatar_url) order by x.created_at)
    from (select * from public.grand_palace_common_posts
       where palace_id=v_palace and removed_at is null
       order by created_at desc limit 40)x
    join public.profiles p on p.id=x.author_id
    where p.visibility<>'hidden' or x.author_id=v_user),'[]'::jsonb),
   'past_wins',coalesce((select jsonb_agg(jsonb_build_object(
      'quarter',s.quarter_start,'name',g.name) order by s.quarter_start desc)
      from public.grand_palace_seasons s join public.grand_palaces g on g.id=s.winner_id
      where s.winner_id=v_palace and s.status='finalized'),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;

create or replace function public.post_grand_palace_common_message(
 p_body text,p_kind text default 'message')
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_body text:=btrim(coalesce(p_body,''));
 v_today integer;v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to join the Grand Palace conversation.'; end if;
 if char_length(v_body) not between 10 and 1000 then raise exception 'Write 10–1,000 characters.'; end if;
 if p_kind not in ('message','introduction','quest') then raise exception 'Unknown Palace message format.'; end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Your Palace membership is unavailable.'; end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),7040313);
 select count(*)::integer into v_today from public.grand_palace_common_posts
 where author_id=v_user and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_today>=5 then raise exception 'The common room permits five posts per day.'; end if;
 insert into public.grand_palace_common_posts(author_id,palace_id,body,kind)
 values(v_user,v_palace,v_body,p_kind) returning id into v_id;
 return v_id;
end $$;

create or replace function public.remove_grand_palace_common_message(p_post_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to manage your posts.'; end if;
 update public.grand_palace_common_posts set removed_at=now()
 where id=p_post_id and author_id=v_user and removed_at is null;
 if not found then raise exception 'Only your active messages can be removed.'; end if;
 return true;
end $$;

revoke all on function private.grand_palace_celestial_award(uuid,text,text) from public,anon,authenticated;
revoke all on function public.enter_celestial_vault(uuid) from public,anon;
revoke all on function public.claim_celestial_badge_grandmaster() from public,anon;
revoke all on function public.get_celestial_vault_status() from public,anon;
revoke all on function public.get_grand_palace_common_room() from public,anon;
revoke all on function public.post_grand_palace_common_message(text,text) from public,anon;
revoke all on function public.remove_grand_palace_common_message(uuid) from public,anon;
grant execute on function public.enter_celestial_vault(uuid) to authenticated;
grant execute on function public.claim_celestial_badge_grandmaster() to authenticated;
grant execute on function public.get_celestial_vault_status() to authenticated;
grant execute on function public.get_grand_palace_common_room() to authenticated;
grant execute on function public.post_grand_palace_common_message(text,text) to authenticated;
grant execute on function public.remove_grand_palace_common_message(uuid) to authenticated;
