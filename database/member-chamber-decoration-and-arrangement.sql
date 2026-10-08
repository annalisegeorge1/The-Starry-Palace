-- Member Chamber Atelier: gentle style unlocks and collision-safe collection rearranging
-- Existing profile covers, themes, artworks, points and inventory are left unchanged.
create table if not exists public.member_chamber_decor(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  backdrop text not null default 'midnight' check(backdrop in ('midnight','moonwater','violet-dusk','aurora','star-garden','crystal-sky')),
  ornament text not null default 'stars' check(ornament in ('none','stars','crescent','ink-vines','silver-branches','royal-constellation')),
  gallery_layout text not null default 'classic' check(gallery_layout in ('classic','compact','spotlight')),
  updated_at timestamptz not null default now()
);
alter table public.member_chamber_decor enable row level security;
revoke all on public.member_chamber_decor from public,anon,authenticated;

create or replace function public.get_member_chamber_decor(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 v_viewer uuid:=auth.uid();
 v_chapters integer:=0;v_words bigint:=0;v_read integer:=0;v_points bigint:=0;
 v_decor record;v_owner boolean;
begin
 if p_member is null then return null; end if;
 if not exists(select 1 from public.profiles where id=p_member and (visibility<>'hidden' or id=v_viewer)) then return null; end if;
 v_owner:=p_member=v_viewer;
 select backdrop,ornament,gallery_layout into v_decor from public.member_chamber_decor where user_id=p_member;
 if v_owner then
  select count(*)::integer,coalesce(sum(c.word_count),0)::bigint into v_chapters,v_words
  from public.chapters c join public.works w on w.id=c.work_id
  where w.author_id=v_viewer and w.publication_status='published' and w.visibility='public'
    and c.status='published';
  select count(*)::integer into v_read from public.palace_reading_sessions
  where reader_id=v_viewer and finished_at is not null and awarded>0;
  select coalesce(lifetime_points,0) into v_points from public.celestial_point_accounts where user_id=v_viewer;
  v_points:=coalesce(v_points,0);
 end if;
 return jsonb_build_object(
  'backdrop',coalesce(v_decor.backdrop,'midnight'),
  'ornament',coalesce(v_decor.ornament,'stars'),
  'gallery_layout',coalesce(v_decor.gallery_layout,'classic'),
  'can_edit',v_owner,
  'unlocks',case when v_owner then jsonb_build_object(
    'published_chapters',v_chapters,'published_words',v_words,'reading_chapters',v_read,
    'aurora',v_chapters>=3,'star-garden',v_words>=1000,'crystal-sky',v_points>=150,
    'crescent',v_chapters>=1,'ink-vines',v_words>=500,
    'silver-branches',v_read>=5,'royal-constellation',v_points>=300,
    'spotlight',v_chapters>=1
  ) else null end
 );
end $$;

create or replace function public.set_member_chamber_decor(
 p_backdrop text,p_ornament text,p_gallery_layout text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_chapters integer:=0;v_words bigint:=0;v_read integer:=0;v_points bigint:=0;
begin
 if v_user is null then raise exception 'Sign in to decorate your chamber.';end if;
 if p_backdrop is null or p_backdrop not in ('midnight','moonwater','violet-dusk','aurora','star-garden','crystal-sky')
   or p_ornament is null or p_ornament not in ('none','stars','crescent','ink-vines','silver-branches','royal-constellation')
   or p_gallery_layout is null or p_gallery_layout not in ('classic','compact','spotlight')
 then raise exception 'Choose a valid chamber decoration.';end if;

 select count(*)::integer,coalesce(sum(c.word_count),0)::bigint into v_chapters,v_words
 from public.chapters c join public.works w on w.id=c.work_id
 where w.author_id=v_user and w.publication_status='published' and w.visibility='public' and c.status='published';
 select count(*)::integer into v_read from public.palace_reading_sessions
 where reader_id=v_user and finished_at is not null and awarded>0;
 select coalesce(lifetime_points,0) into v_points from public.celestial_point_accounts where user_id=v_user;
 v_points:=coalesce(v_points,0);

 if p_backdrop='aurora' and v_chapters<3 then raise exception 'Aurora unlocks after three published chapters.';end if;
 if p_backdrop='star-garden' and v_words<1000 then raise exception 'Star Garden unlocks after 1,000 published words.';end if;
 if p_backdrop='crystal-sky' and v_points<150 then raise exception 'Crystal Sky unlocks after 150 lifetime points.';end if;
 if p_ornament='crescent' and v_chapters<1 then raise exception 'Crescent unlocks after one published chapter.';end if;
 if p_ornament='ink-vines' and v_words<500 then raise exception 'Ink Vines unlocks after 500 published words.';end if;
 if p_ornament='silver-branches' and v_read<5 then raise exception 'Silver Branches unlocks after five rewarded chapter reads.';end if;
 if p_ornament='royal-constellation' and v_points<300 then raise exception 'Royal Constellation unlocks after 300 lifetime points.';end if;
 if p_gallery_layout='spotlight' and v_chapters<1 then raise exception 'Spotlight Gallery unlocks after publishing one chapter.';end if;
 insert into public.member_chamber_decor(user_id,backdrop,ornament,gallery_layout,updated_at)
 values(v_user,p_backdrop,p_ornament,p_gallery_layout,now())
 on conflict(user_id) do update set backdrop=excluded.backdrop,ornament=excluded.ornament,
   gallery_layout=excluded.gallery_layout,updated_at=now();
 return public.get_member_chamber_decor(v_user);
end $$;

-- Existing single-slot RPCs can overwrite an occupied slot. This new RPC swaps or
-- moves the member's existing displayed artwork without un-equipping the other item.
create or replace function public.rearrange_member_chamber_art(
 p_collection text,p_item uuid,p_action text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid();v_current record;v_other record;v_target integer;
begin
 if v_user is null then raise exception 'Sign in to arrange your gallery.';end if;
 if p_item is null or p_collection not in ('achievement','gift') or p_action not in ('up','down','feature')
 then raise exception 'Choose valid gallery artwork and an arrangement.';end if;
 perform 1 from public.profiles where id=v_user for update;
 if p_collection='achievement' then
  select position,display_tier,achievement_id as item_id into v_current
    from public.profile_achievement_showcase where user_id=v_user and achievement_id=p_item;
  if not found then raise exception 'This achievement is not currently displayed.';end if;
  if p_action='feature' then
   if v_current.position=1 then return jsonb_build_object('updated',false,'position',1);end if;
   v_target:=1;
  elsif p_action='up' then
   select max(position) into v_target from public.profile_achievement_showcase
    where user_id=v_user and position<v_current.position;
  else
   select min(position) into v_target from public.profile_achievement_showcase
    where user_id=v_user and position>v_current.position;
  end if;
  if v_target is null then return jsonb_build_object('updated',false,'position',v_current.position);end if;
  select position,display_tier,achievement_id as item_id into v_other
   from public.profile_achievement_showcase where user_id=v_user and position=v_target;
  delete from public.profile_achievement_showcase where user_id=v_user
   and position in (v_current.position,v_target);
  insert into public.profile_achievement_showcase(user_id,achievement_id,display_tier,position,updated_at)
   values(v_user,v_current.item_id,v_current.display_tier,v_target,now());
  if v_other.item_id is not null then
   insert into public.profile_achievement_showcase(user_id,achievement_id,display_tier,position,updated_at)
    values(v_user,v_other.item_id,v_other.display_tier,v_current.position,now());
  end if;
 else
  select position,display_tier,gift_id as item_id into v_current
   from public.profile_gift_showcase where user_id=v_user and gift_id=p_item;
  if not found then raise exception 'This treasure is not currently displayed.';end if;
  if p_action='feature' then
   if v_current.position=1 then return jsonb_build_object('updated',false,'position',1);end if;
   v_target:=1;
  elsif p_action='up' then
   select max(position) into v_target from public.profile_gift_showcase
    where user_id=v_user and position<v_current.position;
  else
   select min(position) into v_target from public.profile_gift_showcase
    where user_id=v_user and position>v_current.position;
  end if;
  if v_target is null then return jsonb_build_object('updated',false,'position',v_current.position);end if;
  select position,display_tier,gift_id as item_id into v_other
   from public.profile_gift_showcase where user_id=v_user and position=v_target;
  delete from public.profile_gift_showcase where user_id=v_user and position in (v_current.position,v_target);
  insert into public.profile_gift_showcase(user_id,gift_id,display_tier,position,updated_at)
   values(v_user,v_current.item_id,v_current.display_tier,v_target,now());
  if v_other.item_id is not null then
   insert into public.profile_gift_showcase(user_id,gift_id,display_tier,position,updated_at)
    values(v_user,v_other.item_id,v_other.display_tier,v_current.position,now());
  end if;
 end if;
 return jsonb_build_object('updated',true,'position',v_target,'swapped',v_other.item_id is not null);
end $$;

revoke all on function public.get_member_chamber_decor(uuid) from public,anon;
revoke all on function public.set_member_chamber_decor(text,text,text) from public,anon;
revoke all on function public.rearrange_member_chamber_art(text,uuid,text) from public,anon;
grant execute on function public.get_member_chamber_decor(uuid) to authenticated;
grant execute on function public.set_member_chamber_decor(text,text,text) to authenticated;
grant execute on function public.rearrange_member_chamber_art(text,uuid,text) to authenticated;
