-- Manual migration for new submissions. Existing thread rows are untouched.
begin;
create table private.discussion_submission_clock (
 author_id uuid primary key references public.profiles(id) on delete cascade,
 next_slot timestamptz not null
);
revoke all on private.discussion_submission_clock from public, anon, authenticated;

create function private.guard_discussion_submission() returns trigger
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 clock_time timestamptz := clock_timestamp();
 writer uuid;
 recipient uuid;
begin
 -- Service-owned operations remain subject to their existing policies.
 if actor is null then return new; end if;
 if new.author_id is distinct from actor then raise exception 'Cannot post this response.'; end if;
 select w.author_id into writer from public.works w where w.id=new.work_id;
 if new.chapter_id is not null and not exists (
  select 1 from public.chapters where id=new.chapter_id and work_id=new.work_id and private.can_read_chapter(work_id,status)
 ) then raise exception 'Discussion is unavailable for this chapter.'; end if;
 if new.parent_comment_id is not null then
  -- UNION removes repeated identities, so malformed legacy cycles terminate.
  with recursive parents as (
   select id,parent_comment_id,author_id from public.comments
    where id=new.parent_comment_id and work_id=new.work_id
    and chapter_id is not distinct from new.chapter_id and status='approved'
   union
   select c.id,c.parent_comment_id,c.author_id from public.comments c
    join parents p on p.parent_comment_id=c.id where c.work_id=new.work_id
    and c.chapter_id is not distinct from new.chapter_id and c.status='approved'
  ) select author_id into recipient from parents where id=new.parent_comment_id
     and exists (select 1 from parents where parent_comment_id is null)
     and not exists (select 1 from parents p join public.user_member_boundaries b on b.blocked
      and ((b.user_id=actor and b.other_user_id=p.author_id) or (b.other_user_id=actor and b.user_id=p.author_id)));
  if recipient is null then raise exception 'This response is unavailable for replies.'; end if;
 end if;
 if exists (
  select 1 from public.user_member_boundaries b where b.blocked and
   ((b.user_id=actor and b.other_user_id in (writer,recipient)) or
    (b.other_user_id=actor and b.user_id in (writer,recipient)))
 ) then raise exception 'This discussion is unavailable.'; end if;
 -- Six immediate submissions, then one slot every ten seconds. The UPSERT
 -- serializes concurrent tabs; deleting a comment does not reset the budget.
 insert into private.discussion_submission_clock as gate(author_id,next_slot)
 values(actor,clock_time+interval '10 seconds')
 on conflict(author_id) do update set next_slot=greatest(clock_timestamp(),gate.next_slot)+interval '10 seconds'
 where gate.next_slot <= clock_timestamp()+interval '50 seconds';
 if not found then raise exception 'Please wait a moment before posting another response.'; end if;
 return new;
end $$;
revoke all on function private.guard_discussion_submission() from public, anon, authenticated;
create trigger guard_discussion_submission before insert on public.comments
 for each row execute function private.guard_discussion_submission();
commit;
