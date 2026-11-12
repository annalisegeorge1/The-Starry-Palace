-- Review only. Requires foundation, treasury and catalogue. Existing selections are preserved.
begin;
create function royal_invitation.owns_welcome(p_user uuid,p_slug text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from royal_invitation.letters l
 join royal_invitation.cosmetics c on c.benefit=l.welcome_gift
 join public.user_gift_inventory i on i.gift_id=c.gift_id and i.user_id=l.accepted_by
 where l.accepted_by=p_user and l.state='redeemed' and l.welcome_gift=p_slug and i.tier='bronze' and i.copies=1)
$$;
revoke all on function royal_invitation.owns_welcome(uuid,text) from public,anon,authenticated,service_role;
insert into public.chamber_prism_palettes(slug,name,family,category,primary_hex,secondary_hex,accent_hex,unlock_key,description)
values ('royal-midnight','Royal Midnight','Royal Invitations','prestige','#14142b','#2d264b','#e4c580','royal_invitation','Exclusive welcome gift for your Chamber.'),
 ('celestial-dawn','Celestial Dawn','Royal Invitations','prestige','#faf4e8','#e9dbf2','#92672b','royal_invitation','Exclusive welcome gift for your Chamber.');
do $$
declare original text;
begin
 select pg_get_expr(conbin,conrelid) into strict original from pg_constraint
 where conrelid='public.member_chamber_decor'::regclass and conname='member_chamber_painted_frame_check' and contype='c';
 alter table public.member_chamber_decor drop constraint member_chamber_painted_frame_check;
 execute format('alter table public.member_chamber_decor add constraint member_chamber_painted_frame_check check ((%s) or chamber_frame in (%L,%L,%L))',
 original,'starforged-circlet','moonlit-heirloom','rose-of-the-court');
end $$;
do $$ begin if md5(pg_get_functiondef('private.painted_frame_eligible(uuid,text)'::regprocedure)) <> '247fd904108c0a01b23954b700eb36a4' then raise exception 'Review updated painted_frame_eligible definition before installation'; end if; end $$;
CREATE OR REPLACE FUNCTION private.painted_frame_eligible(p_user uuid, p_slug text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare pos integer; tier integer; chapters bigint; reads bigint; all_frames text[]:=array['bamboo-ink','willow-mist','lotus-thread','orchid-frost','jade-fern','dusk-ring','moon-halo','golden-orbit','opal-eclipse','aurora-veil','rain-trace','silver-ripple','gilded-tide','frozen-lake','jade-current','ink-circle','script-ribbon','poet-laurel','porcelain-quill','archive-vine','autumn-reed','winter-lace','dawn-petals','crystal-bloom','spring-canopy','bronze-lattice','silver-dewdrop','golden-diadem','platinum-sovereign','emerald-empress','copper-blossom','silver-camellia','golden-garden','platinum-moonflower','emerald-eden','crown-jewel','midnight-sapphire','starlit-amethyst','black-diamond','emerald-garden','ruby-coronation','rose-palace','opal-dream','treasury-relic','celestial-aquamarine','golden-topaz','violet-empress','grand-coronation','sapphire-cathedral','emerald-fortress','black-diamond-throne','amethyst-empress','treasury-vault','rose-palace-deluxe','moonstone-halo','opal-bloom','star-garland','golden-ivy','twilight-pearl'];
begin
 if p_slug in ('starforged-circlet','moonlit-heirloom','rose-of-the-court') then return royal_invitation.owns_welcome(p_user,p_slug); end if;
 if p_user is null then return false;end if;
 if p_slug is null or p_slug in ('solid-midnight-ink','solid-pearl-white','solid-palace-gold','solid-ruby-red','solid-sapphire-blue','solid-amethyst-violet','solid-emerald-green','solid-lagoon-teal','metal-white-gold','metal-rose-gold','metal-silver','metal-copper','metal-bronze','metal-platinum') then return true;end if;
 pos:=array_position(all_frames,p_slug);if pos is null then return false;end if;
 tier:=(pos-1)%5;if tier=0 then return true;end if;
 select count(*) into chapters from public.chapters c join public.works w on w.id=c.work_id where w.author_id=p_user and w.publication_status='published' and w.visibility='public' and c.status='published';
 select count(*) into reads from public.palace_reading_sessions where reader_id=p_user and finished_at is not null and awarded>0;
 return chapters>=(array[0,1,5,20,50])[tier+1] or reads>=(array[0,5,25,100,250])[tier+1];
end $function$;
do $$ begin if md5(pg_get_functiondef('private.chamber_prism_eligible(uuid,text)'::regprocedure)) <> 'c90e2abf3bb2cc4f1de10e862b1a1065' then raise exception 'Review updated chamber_prism_eligible definition before installation'; end if; end $$;
CREATE OR REPLACE FUNCTION private.chamber_prism_eligible(p_member uuid, p_slug text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_item record;v_value bigint:=0;
begin
 if p_slug in ('royal-midnight','celestial-dawn') then return royal_invitation.owns_welcome(p_member,p_slug); end if;
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
do $$ begin if md5(pg_get_functiondef('public.get_painted_chamber_state(uuid)'::regprocedure)) <> '82eb66db5ea9b92e6cc2e73a1c717229' then raise exception 'Review updated get_painted_chamber_state definition before installation'; end if; end $$;
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
 return jsonb_build_object('invitation_frame',case when auth.uid()=p_member then (select l.welcome_gift from royal_invitation.letters l where l.accepted_by=p_member and l.welcome_gift in ('starforged-circlet','moonlit-heirloom','rose-of-the-court') and royal_invitation.owns_welcome(p_member,l.welcome_gift)) end,'chamber_frame',case when private.painted_frame_eligible(p_member,s) then s else null end);
end $function$;
create function royal_invitation.check_worn_gifts() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.chamber_frame in ('starforged-circlet','moonlit-heirloom','rose-of-the-court') and not royal_invitation.owns_welcome(new.user_id,new.chamber_frame)
 or new.prism_palette in ('royal-midnight','celestial-dawn') and not royal_invitation.owns_welcome(new.user_id,new.prism_palette)
 then raise exception 'Invitation gift unavailable'; end if;
 return new;
end $$;
revoke all on function royal_invitation.check_worn_gifts() from public,anon,authenticated,service_role;
create trigger check_invitation_chamber before insert or update of chamber_frame,prism_palette,user_id on public.member_chamber_decor
 for each row execute function royal_invitation.check_worn_gifts();
commit;
