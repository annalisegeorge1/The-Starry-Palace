-- PRISM ATELIER · 41 colourways · backend-owned purchase and reward validation
create table if not exists public.chamber_prism_palettes(
 slug text primary key,
 name text not null,
 family text not null,
 category text not null check(category in ('free','earned','treasury','prestige','legendary')),
 primary_hex text not null check(primary_hex ~ '^#[A-Fa-f0-9]{6}$'),
 secondary_hex text not null check(secondary_hex ~ '^#[A-Fa-f0-9]{6}$'),
 accent_hex text not null check(accent_hex ~ '^#[A-Fa-f0-9]{6}$'),
 point_price integer not null default 0 check(point_price>=0),
 unlock_key text,
 unlock_threshold integer not null default 0,
 description text not null,
 check((category='treasury' and point_price>0) or (category<>'treasury' and point_price=0))
);
alter table public.chamber_prism_palettes enable row level security;
revoke all on public.chamber_prism_palettes from anon,authenticated;
insert into public.chamber_prism_palettes(slug,name,family,category,primary_hex,secondary_hex,accent_hex,point_price,unlock_key,unlock_threshold,description)
values ('midnight','Midnight Velvet','Moon & Night','free','#19254C','#7775B5','#B7BAFF',0,null,0,'The founding midnight chamber'),
('moonwater','Moonwater Glass','Ocean','free','#164960','#80E1EA','#A6FFF3',0,null,0,'Deep teal glass and watery moonlight'),
('violet-dusk','Violet Dusk','Violet','free','#5A3575','#C5A4F2','#F1CCFF',0,null,0,'Orchid light at evening'),
('sapphire-mist','Sapphire Mist','Ocean','free','#284E86','#9DB5DF','#D0E8FF',0,null,0,'A silver-blue sky'),
('rose-twilight','Rose Twilight','Rose','free','#673C68','#EDA2C2','#FFD0E3',0,null,0,'Petals at the last light'),
('teal-reverie','Teal Reverie','Nature','free','#0D5960','#87DBD7','#BFF8EA',0,null,0,'A quiet garden beneath glass'),
('lilac-dawn','Lilac Dawn','Violet','free','#8E79B8','#E8D3F1','#FFE4FA',0,null,0,'First light in a lilac palace'),
('silver-ink','Silver Ink','Moon & Night','free','#35445B','#CBD4E5','#F4F8FF',0,null,0,'Silver-lettered books after dark'),
('storm-blue','Storm Blue','Ocean','free','#1E335C','#7CA4D2','#C3DDFF',0,null,0,'A storm over the observatory'),
('plum-night','Plum Night','Moon & Night','free','#302348','#AD7EBC','#E5C1ED',0,null,0,'A dramatic purple nocturne'),
('aurora','Aurora Veil','Nature','earned','#226F7D','#B0D9E8','#B8FFF0',0,'chapters',3,'Publish three chapters'),
('star-garden','Star Garden','Nature','earned','#255D69','#BBD8AD','#D6FFD1',0,'words',1000,'Publish 1,000 words'),
('crystal-sky','Crystal Sky','Ocean','earned','#4069A1','#C8E9FF','#F1FFFF',0,'points',150,'Earn 150 lifetime points'),
('pearl-moon','Pearl Moon','Moon & Night','earned','#7A8BAA','#EBE6F4','#FEF5FF',0,'chapters',5,'Publish five chapters'),
('sea-lantern','Sea Lantern','Ocean','earned','#146A79','#9CE0DB','#D2FFF5',0,'reads',10,'Complete ten rewarded reads'),
('mist-orchid','Mist Orchid','Rose','earned','#6A618B','#D6ADD9','#F4D4F0',0,'reads',20,'Complete twenty rewarded reads'),
('ink-bloom','Ink Bloom','Violet','earned','#344C6C','#B699CA','#E4BBF4',0,'words',3000,'Publish 3,000 words'),
('winter-glow','Winter Glow','Moon & Night','earned','#5B7B9C','#D8EEFA','#FCFFFF',0,'moons',1,'Receive one Moon'),
('celadon-moon','Celadon Moon','Nature','earned','#3F807B','#C5E9D1','#ECFFF2',0,'hearts',10,'Receive ten Hearts'),
('blue-wisteria','Blue Wisteria','Violet','earned','#355C9B','#B8A1DC','#EDD9FF',0,'stars',5,'Receive five Stars'),
('silver-lullaby','Silver Lullaby','Moon & Night','earned','#6C7696','#D9E2F1','#FAFCFF',0,'chapters',10,'Publish ten chapters'),
('opal-tide','Opal Tide','Ocean','earned','#1D7282','#E0D8EC','#E2FFF9',0,'words',5000,'Publish 5,000 words'),
('icy-periwinkle','Icy Periwinkle','Violet','treasury','#6979C9','#D1D9FF','#EEF3FF',25,null,0,'Soft royalty'),
('frosted-aqua','Frosted Aqua','Ocean','treasury','#378EAA','#C0F2F1','#E7FFFF',35,null,0,'Sea glass and blue frost'),
('royal-amethyst','Royal Amethyst','Violet','treasury','#63378E','#CAAAEC','#EAD5FF',45,null,0,'The royal drawing room'),
('opaline-blue','Opaline Blue','Ocean','treasury','#477EBB','#D7E7F3','#F9FFFF',55,null,0,'Luminescent cloudglass'),
('emerald-rain','Emerald Rain','Nature','treasury','#29685A','#ACE5CA','#DAFFDB',65,null,0,'Jade rain on cathedral windows'),
('honeyed-dawn','Honeyed Dawn','Regalia','treasury','#96714A','#F7D4A6','#FFF1CB',75,null,0,'Warm morning silk'),
('dusty-roseglass','Dusty Roseglass','Rose','treasury','#895E7A','#F0C6D9','#FFE8F0',90,null,0,'Rosewater and silver'),
('blackcurrant-glow','Blackcurrant Glow','Moon & Night','treasury','#352448','#C287C6','#F2C2F0',110,null,0,'Berry velvet at midnight'),
('sunset-plum','Sunset Plum','Rose','treasury','#874773','#E7A8B7','#FFE6D9',145,null,0,'Plum silk and sunset'),
('golden-lilac','Golden Lilac','Regalia','treasury','#8162A9','#F0D6AB','#FFE6C3',175,null,0,'Opulent dusk'),
('champions-aurora','Champion’s Aurora','Prestige','prestige','#1C7B8C','#D5F1D6','#E8FFF8',0,'recent_victory',1,'Win the previous Grand Palace quarter; wearable for one quarter'),
('crownfire-bloom','Crownfire Bloom','Prestige','prestige','#84436C','#E7AD8E','#FFDBC1',0,'winning_top_ten',1,'Finish in the winning Palace’s top ten'),
('royal-nebula','Royal Nebula','Prestige','prestige','#4B397F','#B59AF0','#E9D5FF',0,'winning_first',1,'Finish first in the winning Palace'),
('meteor-silk','Meteor Silk','Prestige','prestige','#2B4E89','#BCD6F4','#E8F4FF',0,'duel_tournament',1,'Win a designated tournament Ink Duel'),
('moonfeather-opal','Moonfeather Opal','Prestige','prestige','#728CA5','#F6D5E3','#FFEBF5',0,'festival_tournament',1,'Win a designated creative festival tournament'),
('empress-nightfall','Empress Nightfall','Prestige','prestige','#37254E','#AE86CC','#EFD6FF',0,'winning_first',2,'Finish first in two quarterly championships'),
('celestial-blackglass','Celestial Blackglass','Legendary','legendary','#171A2F','#8599C7','#E3ECFF',0,'celestial_lottery',1,'Win the Celestial Sovereign lottery'),
('heavens-violet','Heaven’s Violet','Legendary','legendary','#513084','#CBA0F4','#F8DEFF',0,'badge_grandmaster',1,'Complete all founding achievement families at Emerald'),
('prismatic-eclipse','Prismatic Eclipse','Legendary','legendary','#273C62','#D5B3E2','#D3F5FF',0,'palace_victories',4,'Take part in four quarterly Palace victories')
on conflict(slug) do nothing;

create table if not exists public.chamber_prism_ownership(
 user_id uuid not null references public.profiles(id) on delete cascade,
 palette_slug text not null references public.chamber_prism_palettes(slug),
 point_price_paid integer not null check(point_price_paid>=0),
 acquired_at timestamptz not null default now(),
 primary key(user_id,palette_slug)
);
create table if not exists public.chamber_prism_saved_looks(
 user_id uuid not null references public.profiles(id) on delete cascade,
 slot integer not null check(slot between 1 and 5),
 look_name text not null check(char_length(look_name) between 2 and 40),
 palette_slug text not null references public.chamber_prism_palettes(slug),
 finish text not null check(finish in ('soft','glass','shimmer','lacquer','aurora')),
 accent_mode text not null check(accent_mode in ('harmony','silver','rose','mint','gold')),
 updated_at timestamptz not null default now(),
 primary key(user_id,slot)
);
alter table public.chamber_prism_ownership enable row level security;
alter table public.chamber_prism_saved_looks enable row level security;
revoke all on public.chamber_prism_ownership,public.chamber_prism_saved_looks from anon,authenticated;

alter table public.member_chamber_decor
 add column if not exists prism_palette text references public.chamber_prism_palettes(slug),
 add column if not exists prism_finish text not null default 'soft'
  check(prism_finish in ('soft','glass','shimmer','lacquer','aurora')),
 add column if not exists prism_accent text not null default 'harmony'
  check(prism_accent in ('harmony','silver','rose','mint','gold'));

-- All eligibility checks happen in the database. The caller cannot claim a prize.
create or replace function private.chamber_prism_eligible(p_member uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare v_item record;v_value bigint:=0;
begin
 select * into v_item from public.chamber_prism_palettes where slug=p_slug;
 if not found or p_member is null then return false;end if;
 if v_item.category='free' then return true;end if;
 if v_item.category='treasury' then
  return exists(select 1 from public.chamber_prism_ownership where user_id=p_member and palette_slug=p_slug);
 end if;
 if v_item.unlock_key in ('chapters','words') then
  select case v_item.unlock_key when 'chapters' then count(*) else coalesce(sum(c.word_count),0) end
   into v_value from public.chapters c join public.works w on w.id=c.work_id
   where w.author_id=p_member and w.publication_status='published'
     and w.visibility='public' and c.status='published';
 elsif v_item.unlock_key='points' then
  select lifetime_points into v_value from public.celestial_point_accounts where user_id=p_member;
 elsif v_item.unlock_key='reads' then
  select count(*) into v_value from public.palace_reading_sessions
   where reader_id=p_member and finished_at is not null and awarded>0;
 elsif v_item.unlock_key in ('hearts','stars','moons') then
  select display_count into v_value from public.grand_palace_honours
   where user_id=p_member and honour=left(v_item.unlock_key,length(v_item.unlock_key)-1);
 elsif v_item.unlock_key='recent_victory' then
  return exists(select 1 from public.grand_palace_awards
   where user_id=p_member and award_kind='palace_victory'
   and quarter_start=(date_trunc('quarter',now() at time zone 'UTC')-interval '3 months')::date);
 elsif v_item.unlock_key in ('winning_top_ten','winning_first') then
  return exists(select 1 from public.grand_palace_awards
   where user_id=p_member and award_kind='top_ten_box'
   and (v_item.unlock_key='winning_top_ten' or individual_rank=1)
   group by user_id having count(*)>=v_item.unlock_threshold);
 elsif v_item.unlock_key='duel_tournament' then
  return exists(select 1 from public.micro_duel_rewards r
   join public.micro_duels d on d.id=r.duel_id
   where r.winner_id=p_member and d.match_type='tournament' and r.granted_at is not null);
 elsif v_item.unlock_key='festival_tournament' then
  -- No officially registered festival-tournament champions yet.
  return false;
 elsif v_item.unlock_key in ('celestial_lottery','badge_grandmaster') then
  return exists(select 1 from public.grand_palace_celestial_awards
   where user_id=p_member and source=case v_item.unlock_key when 'celestial_lottery' then 'lottery' else 'badge_grandmaster' end);
 elsif v_item.unlock_key='palace_victories' then
  select count(*) into v_value from public.grand_palace_awards
   where user_id=p_member and award_kind='palace_victory';
 else return false; end if;
 return coalesce(v_value,0)>=v_item.unlock_threshold;
end $$;

create or replace function public.get_chamber_prism_state(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_original jsonb;v_selected text;v_finish text;v_accent text;v_balance bigint;v_items jsonb;v_looks jsonb;v_effective text;
begin
 if v_user is null then raise exception 'Sign in to visit the Prism Atelier.';end if;
 v_original:=public.get_member_chamber_decor(p_member);
 if v_original is null then return null; end if;
 select coalesce(prism_palette,backdrop),prism_finish,prism_accent
 into v_selected,v_finish,v_accent from public.member_chamber_decor where user_id=p_member;
 v_selected:=coalesce(v_selected,'midnight');v_finish:=coalesce(v_finish,'soft');v_accent:=coalesce(v_accent,'harmony');
 v_effective:=v_selected;
 if not private.chamber_prism_eligible(p_member,v_selected) then v_effective:='midnight';end if;
 if p_member=v_user then
  select spendable_points into v_balance from public.grand_palace_wallets where user_id=v_user;
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug',p.slug,'name',p.name,'family',p.family,'category',p.category,
    'primary',p.primary_hex,'secondary',p.secondary_hex,'accent',p.accent_hex,
    'price',p.point_price,'description',p.description,
    'unlocked',private.chamber_prism_eligible(v_user,p.slug),
    'owned',p.category='free' or exists(select 1 from public.chamber_prism_ownership o
      where o.user_id=v_user and o.palette_slug=p.slug),
    'selected',p.slug=v_effective
   ) order by case p.category when 'free' then 1 when 'earned' then 2
      when 'treasury' then 3 when 'prestige' then 4 else 5 end,p.name),'[]'::jsonb)
   into v_items from public.chamber_prism_palettes p;
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'name',look_name,
    'palette',palette_slug,'finish',finish,'accent',accent_mode) order by slot),'[]'::jsonb)
   into v_looks from public.chamber_prism_saved_looks where user_id=v_user;
 end if;
 return v_original||jsonb_build_object(
  'prism_palette',v_effective,'prism_requested_palette',v_selected,
  'prism_finish',v_finish,'prism_accent',v_accent,
  'prism_palette_data',(select jsonb_build_object(
     'slug',slug,'name',name,'primary',primary_hex,'secondary',secondary_hex,'accent',accent_hex)
     from public.chamber_prism_palettes where slug=v_effective),
  'prism_catalogue',case when p_member=v_user then coalesce(v_items,'[]'::jsonb) else null end,
  'prism_looks',case when p_member=v_user then coalesce(v_looks,'[]'::jsonb) else null end,
  'prism_balance',case when p_member=v_user then coalesce(v_balance,0) else null end
 );
end $$;

create or replace function public.purchase_chamber_prism_palette(p_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_cost integer;v_balance bigint;
begin
 if v_user is null then raise exception 'Sign in to visit the Prism Treasury.';end if;
 select point_price into v_cost from public.chamber_prism_palettes
 where slug=p_slug and category='treasury';
 if v_cost is null then raise exception 'This colour is not available for purchase.';end if;
 select spendable_points into v_balance from public.grand_palace_wallets
  where user_id=v_user for update;
 if not found then raise exception 'Your spendable-point wallet is not available.';end if;
 if exists(select 1 from public.chamber_prism_ownership where user_id=v_user and palette_slug=p_slug)
 then return jsonb_build_object('owned',true,'already_owned',true,'balance',v_balance,'charged',0); end if;
 if v_balance<v_cost then raise exception 'You need % spendable Celestial Points for this colour.',v_cost; end if;
 insert into public.chamber_prism_ownership(user_id,palette_slug,point_price_paid)
 values(v_user,p_slug,v_cost);
 update public.grand_palace_wallets set spendable_points=spendable_points-v_cost,updated_at=now()
 where user_id=v_user returning spendable_points into v_balance;
 return jsonb_build_object('owned',true,'already_owned',false,'balance',v_balance,'charged',v_cost,'palette',p_slug);
end $$;

create or replace function public.select_chamber_prism_palette(
 p_slug text,p_finish text default 'soft',p_accent text default 'harmony'
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to decorate your chamber.';end if;
 if p_finish not in ('soft','glass','shimmer','lacquer','aurora')
 or p_accent not in ('harmony','silver','rose','mint','gold') or
 not private.chamber_prism_eligible(v_user,p_slug)
 then raise exception 'This Prism Atelier combination is not unlocked.';end if;
 insert into public.member_chamber_decor(user_id,prism_palette,prism_finish,prism_accent,updated_at)
 values(v_user,p_slug,p_finish,p_accent,now())
 on conflict(user_id) do update set prism_palette=excluded.prism_palette,
 prism_finish=excluded.prism_finish,prism_accent=excluded.prism_accent,updated_at=now();
 return public.get_chamber_prism_state(v_user);
end $$;

create or replace function public.save_chamber_prism_look(
 p_slot integer,p_name text,p_slug text,p_finish text,p_accent text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to save a chamber look.';end if;
 if p_slot not between 1 and 5 or char_length(btrim(coalesce(p_name,''))) not between 2 and 40
  or p_finish not in ('soft','glass','shimmer','lacquer','aurora')
  or p_accent not in ('harmony','silver','rose','mint','gold')
  or not private.chamber_prism_eligible(v_user,p_slug)
 then raise exception 'Choose an unlocked colour and a valid saved look.';end if;
 insert into public.chamber_prism_saved_looks(user_id,slot,look_name,palette_slug,finish,accent_mode,updated_at)
 values(v_user,p_slot,btrim(p_name),p_slug,p_finish,p_accent,now())
 on conflict(user_id,slot) do update set look_name=excluded.look_name,
 palette_slug=excluded.palette_slug,finish=excluded.finish,accent_mode=excluded.accent_mode,updated_at=now();
 return public.get_chamber_prism_state(v_user);
end $$;

revoke all on function private.chamber_prism_eligible(uuid,text) from public,anon,authenticated;
revoke all on function public.get_chamber_prism_state(uuid) from public,anon;
revoke all on function public.purchase_chamber_prism_palette(text) from public,anon;
revoke all on function public.select_chamber_prism_palette(text,text,text) from public,anon;
revoke all on function public.save_chamber_prism_look(integer,text,text,text,text) from public,anon;
grant execute on function public.get_chamber_prism_state(uuid) to authenticated;
grant execute on function public.purchase_chamber_prism_palette(text) to authenticated;
grant execute on function public.select_chamber_prism_palette(text,text,text) to authenticated;
grant execute on function public.save_chamber_prism_look(integer,text,text,text,text) to authenticated;
