-- Synthetic schema. Real eligibility and equip function bodies follow.
create table public.member_chamber_decor(user_id uuid primary key,chamber_frame text,prism_palette text,prism_finish text,prism_accent text,updated_at timestamptz, constraint member_chamber_painted_frame_check check(chamber_frame is null or chamber_frame='metal-white-gold'));
create table public.chamber_prism_palettes(slug text primary key,name text,family text,category text,primary_hex text,secondary_hex text,accent_hex text,unlock_key text,description text);
create function public.get_member_chamber_decor(uuid) returns jsonb language sql as $$select '{}'::jsonb$$;
create function public.get_chamber_prism_state(uuid) returns jsonb language sql as $$select jsonb_build_object('prism_palette',prism_palette) from public.member_chamber_decor where user_id=$1$$;
CREATE OR REPLACE FUNCTION private.painted_frame_eligible(p_user uuid, p_slug text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare pos integer; tier integer; chapters bigint; reads bigint; all_frames text[]:=array['bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress','grand-coronation','sapphire-cathedral','emerald-fortress','black-diamond-throne','amethyst-empress','treasury-vault','rose-palace-deluxe','moonstone-halo','opal-bloom','star-garland','golden-ivy','twilight-pearl'];
begin
 if p_user is null then return false;end if;
 if p_slug is null or p_slug in ('solid-midnight-ink','solid-pearl-white','solid-palace-gold','solid-ruby-red','solid-sapphire-blue','solid-amethyst-violet','solid-emerald-green','solid-lagoon-teal','metal-white-gold','metal-rose-gold','metal-silver','metal-copper','metal-bronze','metal-platinum') then return true;end if;
 pos:=array_position(all_frames,p_slug);if pos is null then return false;end if;
 tier:=(pos-1)%5;if tier=0 then return true;end if;
 select count(*) into chapters from public.chapters c join public.works w on w.id=c.work_id where w.author_id=p_user and w.publication_status='published' and w.visibility='public' and c.status='published';
 select count(*) into reads from public.palace_reading_sessions where reader_id=p_user and finished_at is not null and awarded>0;
 return chapters>=(array[0,1,5,20,50])[tier+1] or reads>=(array[0,5,25,100,250])[tier+1];
end $function$;
CREATE OR REPLACE FUNCTION private.chamber_prism_eligible(p_member uuid, p_slug text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;
CREATE OR REPLACE FUNCTION public.get_painted_chamber_state(p_member uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s text;
begin
 if auth.uid() is null then raise exception 'Sign in to visit chambers.';end if;
 if public.get_member_chamber_decor(p_member) is null then return null;end if;
 select chamber_frame into s from public.member_chamber_decor where user_id=p_member;
 return jsonb_build_object('chamber_frame',case when private.painted_frame_eligible(p_member,s) then s else null end);
end $function$;
CREATE OR REPLACE FUNCTION public.set_painted_chamber_frame(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in to decorate your chamber.';end if;
 if not private.painted_frame_eligible(u,p_slug) then raise exception 'This frame is not unlocked yet.';end if;
 insert into public.member_chamber_decor(user_id,chamber_frame) values(u,p_slug)
 on conflict(user_id) do update set chamber_frame=excluded.chamber_frame,updated_at=now();
 return public.get_painted_chamber_state(u);
end $function$;
CREATE OR REPLACE FUNCTION public.select_chamber_prism_palette(p_slug text, p_finish text DEFAULT 'soft'::text, p_accent text DEFAULT 'harmony'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;
