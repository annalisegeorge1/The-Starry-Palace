-- EPHEMERAL TEST-ONLY schema. Never run this file against production.
-- This deliberately represents only the dependencies of proposed RPCs.
create schema auth;
create schema private;
create schema extensions;
create extension if not exists pg_trgm with schema extensions;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;

create table private.test_ages(user_id uuid primary key, years integer not null);
create table private.test_blocks(viewer_id uuid, target_id uuid);
create table public.works(
  id uuid primary key, author_id uuid not null, publication_status text not null,
  visibility text not null, minimum_reader_age integer
);
create table public.chapters(
  id uuid primary key, work_id uuid references public.works(id),
  status text not null, title text, position integer
);
create table public.work_collaborators(work_id uuid,user_id uuid,status text,role text);
create table public.palace_praises(
  id uuid primary key default gen_random_uuid(),giver_id uuid,receiver_id uuid,
  target_kind text,target_id uuid,praise_type text,
  giver_points_awarded integer not null default 0,
  receiver_points_awarded integer not null default 0,
  updated_at timestamptz default now(),
  unique(giver_id,target_kind,target_id)
);
create table public.saved_works(work_id uuid);
create table public.profiles(id uuid primary key,visibility text,username text,display_name text);
create table public.privacy_preferences(user_id uuid primary key,discovery_visibility text);
create table public.grand_palaces(id uuid primary key,name text,slug text,sigil text,accent text,motto text);
create table public.grand_palace_memberships(user_id uuid,palace_id uuid);
create table public.grand_palace_wallets(user_id uuid,selected_theme text);
create table public.grand_palace_honours(user_id uuid,honour text,display_count integer);
create table public.reading_progress(user_id uuid,work_id uuid,chapter_id uuid);
create table public.work_lore_entries(
 id uuid primary key,work_id uuid,kind text,title text,summary text,body text,
 reveal_mode text,unlock_chapter_id uuid,sort_order integer
);
create table public.celestial_point_ledger(
 user_id uuid, channel text, points integer, created_at timestamptz default now(),
 award_key text unique
);
create table public.tags(id uuid primary key,name text,category text,status text);
create table public.work_tags(work_id uuid,tag_id uuid);
create table public.comics(id uuid primary key,publication_status text,visibility text,minimum_reader_age integer);
create table public.comic_tags(comic_id uuid,tag_id uuid);

create function private.member_meets_age(p_minimum_age integer)
returns boolean language sql stable security definer set search_path to '' as $$
 select case when auth.uid() is null then coalesce(p_minimum_age,12)<=12
  else exists(select 1 from private.test_ages a
   where a.user_id=auth.uid() and a.years>=greatest(coalesce(p_minimum_age,12),12)) end
$$;
create function private.is_work_owner(p_work uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from public.works w where w.id=p_work and w.author_id=auth.uid())
$$;
create function private.is_accepted_work_collaborator(p_work uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from public.work_collaborators c
  where c.work_id=p_work and c.user_id=auth.uid() and c.status='accepted')
$$;
create function private.can_edit_shared_work(p_work uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select private.is_work_owner(p_work)
    or exists(select 1 from public.work_collaborators c
       where c.work_id=p_work and c.user_id=auth.uid()
       and c.status='accepted' and c.role in ('co_writer','editor'))
$$;
create function private.can_read_chapter(p_work uuid,p_chapter_status text)
returns boolean language sql stable security definer set search_path to '' as $$
 select private.can_edit_shared_work(p_work) or exists(
  select 1 from public.works w where w.id=p_work
   and w.publication_status='published' and p_chapter_status='published'
   and (w.visibility='public' or (w.visibility='members' and auth.uid() is not null))
   and private.member_meets_age(w.minimum_reader_age))
$$;
create function private.viewer_can_discover_profile(target_user uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select target_user=auth.uid() or (
  (auth.uid() is null or not exists(
   select 1 from private.test_blocks b
   where b.viewer_id=auth.uid() and b.target_id=target_user))
  and exists(select 1 from public.profiles p where p.id=target_user
    and (p.visibility='public' or (p.visibility='members' and auth.uid() is not null)))
  and coalesce((select case pp.discovery_visibility
    when 'everyone' then true
    when 'members' then auth.uid() is not null
    else false end
    from public.privacy_preferences pp where pp.user_id=target_user),true)
 )
$$;

create function private.grant_celestial_points(
 p_user uuid,p_points integer,p_channel text,p_source text,p_target_kind text,
 p_target_id uuid,p_other_user uuid,p_award_key text
) returns integer language plpgsql security definer set search_path to '' as $$
declare v_inserted integer;
begin
 if p_points<=0 then return 0; end if;
 insert into public.celestial_point_ledger(user_id,channel,points,award_key)
 values(p_user,p_channel,p_points,p_award_key)
 on conflict(award_key) do nothing;
 get diagnostics v_inserted=row_count;
 return case when v_inserted=1 then p_points else 0 end;
end;
$$;

insert into private.test_ages values
 ('00000000-0000-0000-0000-000000000001',30),
 ('00000000-0000-0000-0000-000000000002',30),
 ('00000000-0000-0000-0000-000000000003',13),
 ('00000000-0000-0000-0000-000000000004',25),
 ('00000000-0000-0000-0000-000000000005',25);

insert into public.works values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','published','public',12),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','draft','private',12),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','published','members',13),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','published','public',18),
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','published','hidden',12),
 ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','draft','public',12);
insert into public.chapters values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','published','Published chapter',1),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','draft','SECRET DRAFT CHAPTER',2),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','published','Members chapter',1),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','published','Adult chapter',1);
insert into public.work_collaborators values
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','accepted','editor');
insert into public.saved_works values
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000003'),
 ('10000000-0000-0000-0000-000000000004'),
 ('10000000-0000-0000-0000-000000000002');
insert into public.palace_praises(giver_id,receiver_id,target_kind,target_id,praise_type) values
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','work','10000000-0000-0000-0000-000000000001','heart'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','work','10000000-0000-0000-0000-000000000002','crown'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','work','10000000-0000-0000-0000-000000000004','star');
insert into public.profiles values
 ('00000000-0000-0000-0000-000000000001','public','author','Synthetic owner'),
 ('00000000-0000-0000-0000-000000000002','public','reader','Synthetic reader');
insert into public.privacy_preferences values
 ('00000000-0000-0000-0000-000000000001','private');
insert into public.grand_palaces values
 ('30000000-0000-0000-0000-000000000001','Synthetic Palace','synthetic','sigil','accent','motto');
insert into public.grand_palace_memberships values
 ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
insert into public.grand_palace_wallets values
 ('00000000-0000-0000-0000-000000000001','midnight');
insert into public.grand_palace_honours values
 ('00000000-0000-0000-0000-000000000001','badge',1);
insert into public.work_lore_entries values
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
  'character','Hidden chapter linked lore','summary','LOCKED BODY','after_chapter',
  '20000000-0000-0000-0000-000000000002',1);
insert into public.tags values
 ('50000000-0000-0000-0000-000000000001','PublicTag','genre','canonical'),
 ('50000000-0000-0000-0000-000000000002','DraftOnlyTag','genre','community'),
 ('50000000-0000-0000-0000-000000000003','AdultTag','genre','community');
insert into public.work_tags values
 ('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002'),
 ('10000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000003');
insert into public.comics values
 ('60000000-0000-0000-0000-000000000001','draft','private',12),
 ('60000000-0000-0000-0000-000000000002','published','public',18);
insert into public.comic_tags values
 ('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002'),
 ('60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003');

-- Extra unpublished chapter on the editor-assigned private test work.
insert into public.chapters values
 ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000002','draft','Editor-assigned private chapter',1);
