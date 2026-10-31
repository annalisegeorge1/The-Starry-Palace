-- EPHEMERAL synthetic PostgreSQL RLS policy tests; NOT Supabase Storage API.
-- Mirrors live storage.objects read/write policy conditions reviewed 2026-10-31.
-- No member records or file bytes; test only invented path strings and IDs.

grant usage on schema storage to anon,authenticated;
grant select on storage.objects to anon,authenticated;
grant insert,update,delete on storage.objects to authenticated;
alter table storage.objects enable row level security;

create policy "comic asset owner select" on storage.objects
for select to authenticated using (
 bucket_id=any(array['comic-covers','comic-pages','comic-originals'])
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "comic asset owner update" on storage.objects
for update to authenticated using (
 bucket_id=any(array['comic-covers','comic-pages','comic-originals'])
 and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
 bucket_id=any(array['comic-covers','comic-pages','comic-originals'])
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "comic asset owner delete" on storage.objects
for delete to authenticated using (
 bucket_id=any(array['comic-covers','comic-pages','comic-originals'])
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "comic cover owner insert" on storage.objects
for insert to authenticated with check (
 bucket_id='comic-covers'
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "comic page owner insert" on storage.objects
for insert to authenticated with check (
 bucket_id='comic-pages'
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "comic original owner insert" on storage.objects
for insert to authenticated with check (
 bucket_id='comic-originals'
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "read accessible comic covers" on storage.objects
for select to public using (
 bucket_id='comic-covers' and exists(
  select 1 from public.comics c where c.cover_path=objects.name
    and c.publication_status='published'
    and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
    and private.member_meets_age(c.minimum_reader_age)
 )
);
create policy "read accessible comic reader pages" on storage.objects
for select to public using (
 bucket_id='comic-pages' and exists(
  select 1 from public.comic_pages p
  join public.comic_episodes e on e.id=p.episode_id
  join public.comics c on c.id=e.comic_id
  where p.reader_path=objects.name
    and c.publication_status='published'
    and e.status='published'
    and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
    and private.member_meets_age(c.minimum_reader_age)
 )
);
create policy "conversation members read chat photos" on storage.objects
for select to authenticated using (
 bucket_id='palace-chat-photos' and private.can_access_palace_chat_photo(name,false)
);
create policy "active members upload own chat photos" on storage.objects
for insert to authenticated with check (
 bucket_id='palace-chat-photos'
 and (storage.foldername(name))[3] = (select auth.uid())::text
 and private.can_access_palace_chat_photo(name,true)
);
create policy "senders remove own chat photos" on storage.objects
for delete to authenticated using (
 bucket_id='palace-chat-photos'
 and (storage.foldername(name))[3] = (select auth.uid())::text
 and private.can_access_palace_chat_photo(name,false)
);

-- Add another author's original to prove the current author cannot view it.
insert into storage.objects(bucket_id,name) values
 ('comic-originals','00000000-0000-0000-0000-000000000002/other-original.png');

set role anon;
select set_config('request.jwt.claim.sub','',false);
do $check$
declare n integer;
begin
 select count(*) into n from storage.objects where bucket_id='comic-covers';
 if n<>1 then raise exception 'guest cover count expected 1, got %',n; end if;
 select count(*) into n from storage.objects where bucket_id='comic-pages';
 if n<>1 then raise exception 'guest published reader pages count expected 1'; end if;
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>0 then raise exception 'guest accessed an original file'; end if;
 select count(*) into n from storage.objects where bucket_id='palace-chat-photos';
 if n<>0 then raise exception 'guest accessed private chat photos'; end if;
end $check$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $check$
declare n integer; denied boolean := false;
begin
 select count(*) into n from storage.objects where bucket_id='comic-covers';
 if n<>2 then raise exception '13-year-old should see public + members covers; got %',n; end if;
 select count(*) into n from storage.objects where bucket_id='comic-pages';
 if n<>1 then raise exception '13-year-old should not see adult or draft comic pages'; end if;
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>0 then raise exception 'unrelated young reader saw comic original'; end if;
 select count(*) into n from storage.objects where bucket_id='palace-chat-photos';
 if n<>0 then raise exception 'nonmember saw direct/group chat photos'; end if;
 begin
  insert into storage.objects(bucket_id,name) values
   ('palace-chat-photos',
   'direct/70000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000003/72000000-0000-0000-0000-000000000033.webp');
 exception when others then denied := true; end;
 if not denied then raise exception 'nonmember could upload photo to direct chat'; end if;
end $check$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $check$
declare n integer; denied boolean := false;
begin
 select count(*) into n from storage.objects where bucket_id='comic-covers';
 if n<>3 then raise exception 'adult eligible public/members/18+ covers expected 3'; end if;
 select count(*) into n from storage.objects where bucket_id='comic-pages';
 if n<>2 then raise exception 'adult eligible reader pages expected 2'; end if;
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>1 then raise exception 'adult saw someone else original or lost own original'; end if;
 select count(*) into n from storage.objects where bucket_id='palace-chat-photos';
 if n<>1 then raise exception 'direct conversation member should see one photo'; end if;
 begin
  insert into storage.objects(bucket_id,name) values
   ('comic-originals','00000000-0000-0000-0000-000000000001/attempt-stolen.png');
 exception when others then denied := true; end;
 if not denied then raise exception 'unrelated adult uploaded into another author originals'; end if;
end $check$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $check$
declare n integer;
begin
 select count(*) into n from storage.objects where bucket_id='palace-chat-photos';
 if n<>1 then raise exception 'group member should see group photo but not direct photo'; end if;
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>0 then raise exception 'collaborator should not see unrelated original comic assets'; end if;
end $check$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $check$
declare n integer;
begin
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>2 then raise exception 'owner should see own originals but not other creators originals'; end if;
 select count(*) into n from storage.objects where bucket_id='palace-chat-photos';
 if n<>2 then raise exception 'owner chat membership should include direct and group photos'; end if;
 insert into storage.objects(bucket_id,name) values
 ('comic-originals','00000000-0000-0000-0000-000000000001/owner-new-original.png');
 insert into storage.objects(bucket_id,name) values
 ('palace-chat-photos',
 'direct/70000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000001/72000000-0000-0000-0000-000000000099.webp');
 select count(*) into n from storage.objects where bucket_id='comic-originals';
 if n<>3 then raise exception 'owner upload comic original failed'; end if;
end $check$;
reset role;

select set_config('request.jwt.claim.sub','',false);
select 'PASS: synthetic comic originals, reader pages, covers and chat-photo storage RLS' as result;
