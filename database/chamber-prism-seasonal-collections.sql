-- Seasonal Prism Atelier: twelve quarterly palettes, permanently collectible during their quarter
alter table public.chamber_prism_palettes drop constraint chamber_prism_palettes_category_check;
alter table public.chamber_prism_palettes add constraint chamber_prism_palettes_category_check
 check(category in ('free','earned','treasury','seasonal','prestige','legendary'));
alter table public.chamber_prism_palettes drop constraint chamber_prism_palettes_check;
alter table public.chamber_prism_palettes add constraint chamber_prism_palettes_check
 check((category in ('treasury','seasonal') and point_price>0) or
 (category not in ('treasury','seasonal') and point_price=0));
alter table public.chamber_prism_palettes
 add column if not exists season_quarter integer check(season_quarter between 1 and 4);
alter table public.chamber_prism_palettes
 add constraint chamber_prism_season_consistency check(
  (category='seasonal' and season_quarter is not null) or
  (category<>'seasonal' and season_quarter is null));
insert into public.chamber_prism_palettes(slug,name,family,category,primary_hex,secondary_hex,accent_hex,point_price,unlock_key,unlock_threshold,description,season_quarter)
values ('frostlight-blue','Frostlight Blue','Seasonal','seasonal','#456992','#D6E8FE','#F1FAFF',30,null,0,'Cold silver-blue starlight',1),
('new-moon-pearl','New Moon Pearl','Seasonal','seasonal','#676B9C','#F8DFEA','#FFF8FD',50,null,0,'Pink pearls below an indigo moon',1),
('thawing-opal','Thawing Opal','Seasonal','seasonal','#346D83','#CBE8D8','#EEFFFA',80,null,0,'An opalescent dawn',1),
('lilyglass','Lilyglass','Seasonal','seasonal','#668B80','#E9E0FF','#FFF6FF',30,null,0,'Lilies suspended in spring glass',2),
('blossom-aurora','Blossom Aurora','Seasonal','seasonal','#8C5795','#E6BBD8','#F7E3FA',55,null,0,'Pink auroral blossoms',2),
('jade-morning','Jade Morning','Seasonal','seasonal','#36776D','#E3F4B7','#F7FFE5',85,null,0,'Green light in porcelain gardens',2),
('sapphire-solstice','Sapphire Solstice','Seasonal','seasonal','#2756A3','#DBD5F6','#FFFFFF',35,null,0,'A long sapphire twilight',3),
('tidefire','Tidefire','Seasonal','seasonal','#296F9A','#EFB588','#FFE3C5',60,null,0,'Iridescent embers over tropical water',3),
('summer-comet','Summer Comet','Seasonal','seasonal','#5D469C','#F8BEB7','#FFE9E9',90,null,0,'A star trail in violet coral',3),
('harvest-amethyst','Harvest Amethyst','Seasonal','seasonal','#6B457A','#D9AE94','#FAE4CC',40,null,0,'The first warm lantern at dusk',4),
('lantern-ember','Lantern Ember','Seasonal','seasonal','#7A385E','#EDAC83','#FFDFB8',65,null,0,'Rose-violet silk and luminous embers',4),
('moonlit-evergreen','Moonlit Evergreen','Seasonal','seasonal','#245E62','#A5D8C4','#E6FFF1',95,null,0,'An evergreen garden beneath winter stars',4) on conflict(slug) do nothing;
-- Include seasonal palettes in earned/owned checks, keeping ownership forever once bought
create or replace function private.chamber_prism_eligible(p_member uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare v_item record;v_value bigint:=0;
begin
 select * into v_item from public.chamber_prism_palettes where slug=p_slug;
 if not found or p_member is null then return false;end if;
 if v_item.category='free' then return true;end if;
 if v_item.category in ('treasury','seasonal') then
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


-- Always calculate current season from authoritative UTC, never the browser clock
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
    'price',p.point_price,'description',p.description,'season_quarter',p.season_quarter,
    'available_now',p.category<>'seasonal' or p.season_quarter=extract(quarter from now() at time zone 'UTC')::integer,
    'unlocked',private.chamber_prism_eligible(v_user,p.slug),
    'owned',p.category='free' or exists(select 1 from public.chamber_prism_ownership o
      where o.user_id=v_user and o.palette_slug=p.slug),
    'selected',p.slug=v_effective
   ) order by case p.category when 'free' then 1 when 'earned' then 2
      when 'treasury' then 3 when 'seasonal' then 4 when 'prestige' then 5 else 6 end,p.name),'[]'::jsonb)
   into v_items from public.chamber_prism_palettes p;
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'name',look_name,
    'palette',palette_slug,'finish',finish,'accent',accent_mode) order by slot),'[]'::jsonb)
   into v_looks from public.chamber_prism_saved_looks where user_id=v_user;
 end if;
 return v_original||jsonb_build_object(
  'prism_season',extract(quarter from now() at time zone 'UTC')::integer,
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


-- Reuse atomic wallet locking and idempotent permanent ownership for seasonal purchases
create or replace function public.purchase_chamber_prism_palette(p_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_cost integer;v_balance bigint;v_category text;v_quarter integer;
begin
 if v_user is null then raise exception 'Sign in to visit the Prism Treasury.';end if;
 select point_price,category,season_quarter into v_cost,v_category,v_quarter from public.chamber_prism_palettes
 where slug=p_slug and category in ('treasury','seasonal');
 if v_cost is null then raise exception 'This colour is not available for purchase.';end if;
 if v_category='seasonal' and v_quarter is distinct from extract(quarter from now() at time zone 'UTC')::integer then
  raise exception 'This seasonal collection is not currently open.';end if;
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


revoke all on function private.chamber_prism_eligible(uuid,text) from public,anon,authenticated;
revoke all on function public.get_chamber_prism_state(uuid) from public,anon;
revoke all on function public.purchase_chamber_prism_palette(text) from public,anon;
grant execute on function public.get_chamber_prism_state(uuid) to authenticated;
grant execute on function public.purchase_chamber_prism_palette(text) to authenticated;
