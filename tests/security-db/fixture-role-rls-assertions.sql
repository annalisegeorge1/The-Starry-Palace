-- Synthetic PostgreSQL role and RLS checks, NOT live Supabase.
-- The policy expressions mirror those observed in the production
-- public.works and public.chapters schemas on 2026-10-31.
-- Executed only in a fresh CI PostgreSQL database with invented UUIDs.
-- These are real PG roles and RLS policies, but auth.uid() is still
-- controlled by a synthetic session variable, not a verified JWT.

create role anon nologin;
create role authenticated nologin;

grant usage on schema public, private, auth to anon, authenticated;
grant select on public.works, public.chapters to anon, authenticated;
grant insert, update, delete on public.works, public.chapters to authenticated;
-- Postgres normally grants EXECUTE on new functions to PUBLIC. This test
-- intentionally grants only the targeted API methods to simulate access.
revoke all on function public.get_work_lore(uuid) from public;
revoke all on function public.get_palace_praise_state(text,uuid) from public;
revoke all on function public.get_reading_room_bookmark_counts(uuid[]) from public;
grant execute on function public.get_work_lore(uuid) to anon, authenticated;
grant execute on function public.get_palace_praise_state(text,uuid) to anon, authenticated;
grant execute on function public.get_reading_room_bookmark_counts(uuid[]) to anon, authenticated;

alter table public.works enable row level security;
alter table public.chapters enable row level security;

create policy "read accessible works" on public.works
for select to public using (
  author_id=(select auth.uid())
  or private.is_accepted_work_collaborator(id)
  or (
    publication_status='published'
    and (
      visibility='public'
      or (visibility='members' and (select auth.uid()) is not null)
    )
    and private.member_meets_age(minimum_reader_age)
  )
);

create policy "authors create works" on public.works
for insert to authenticated with check (author_id=(select auth.uid()));

create policy "authors update own works" on public.works
for update to authenticated
using (author_id=(select auth.uid()))
with check (author_id=(select auth.uid()));

create policy "authors delete own works" on public.works
for delete to authenticated using (author_id=(select auth.uid()));

create policy "read accessible chapters" on public.chapters
for select to anon, authenticated
using (private.can_read_chapter(work_id,status));

create policy "owners and collaborators create chapters" on public.chapters
for insert to authenticated with check (private.can_edit_shared_work(work_id));

create policy "owners and collaborators update chapters" on public.chapters
for update to authenticated
using (private.can_edit_shared_work(work_id))
with check (private.can_edit_shared_work(work_id));

create policy "authors delete chapters" on public.chapters
for delete to authenticated using (private.is_work_owner(work_id));

-- Guest: public 12+ readable, all unpublished/member/18+ content hidden.
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$
declare n integer;
begin
 select count(*) into n from public.works;
 if n <> 1 then raise exception 'anon work RLS: expected exactly one public 12+ work, saw %',n; end if;
 select count(*) into n from public.chapters;
 if n <> 1 then raise exception 'anon chapter RLS: unpublished or restricted chapter exposed'; end if;
 select count(*) into n from public.works
 where id='10000000-0000-0000-0000-000000000002';
 if n<>0 then raise exception 'anon can directly read author draft';end if;
end $$;
reset role;

-- Underage signed-in reader: members 13+ allowed; adult work denied.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
declare n integer;
begin
 select count(*) into n from public.works;
 if n<>2 then raise exception 'younger reader expected public 12+ and members 13+; got %',n;end if;
 select count(*) into n from public.chapters;
 if n<>2 then raise exception 'younger reader chapter access mismatch';end if;
end $$;
reset role;

-- Unrelated adult can read published age-eligible work but not hidden draft;
-- update attempts on another owner's work and chapters must affect zero rows.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare n integer;
begin
 select count(*) into n from public.works;
 if n<>3 then raise exception 'unrelated adult access mismatch, saw %',n;end if;
 select count(*) into n from public.chapters;
 if n<>3 then raise exception 'unrelated adult chapter RLS mismatch';end if;
 update public.works set visibility=visibility
 where id='10000000-0000-0000-0000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'unrelated adult updated a private draft';end if;
 update public.chapters set title=title
 where id='20000000-0000-0000-0000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'unrelated adult edited an unpublished chapter';end if;
end $$;
reset role;

-- Accepted editor may view and edit assigned draft's chapters, not the
-- work's owner-only metadata. Owner can access and update their own drafts.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$
declare n integer;
begin
 select count(*) into n from public.works where id='10000000-0000-0000-0000-000000000002';
 if n<>1 then raise exception 'editor cannot view assigned work';end if;
 select count(*) into n from public.chapters where id='20000000-0000-0000-0000-000000000002';
 if n<>0 then raise exception 'editor reached unassigned chapter: check fixture';end if;
 update public.works set visibility=visibility
 where id='10000000-0000-0000-0000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'editor modified owner-only work settings';end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
declare n integer;
begin
 select count(*) into n from public.works where id='10000000-0000-0000-0000-000000000002';
 if n<>1 then raise exception 'owner cannot see private draft';end if;
 update public.works set visibility=visibility where id='10000000-0000-0000-0000-000000000002';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'owner cannot update private draft';end if;
 select count(*) into n from public.chapters where id='20000000-0000-0000-0000-000000000002';
 if n<>1 then raise exception 'owner cannot see unpublished chapter';end if;
 update public.chapters set title=title where id='20000000-0000-0000-0000-000000000002';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'owner cannot update unpublished chapter';end if;
end $$;
reset role;

select set_config('request.jwt.claim.sub','',false);
select 'Synthetic real-role works/chapters RLS assertions passed' as result;
