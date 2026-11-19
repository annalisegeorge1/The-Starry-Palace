-- Reviewed rollback for this feature only. Disable the two client flags first.
-- Retain member preferences, revisions, pins and reactions for recovery.
begin;
drop trigger if exists alert_discussion_readers on public.comments;
drop trigger if exists guard_closed_discussion on public.comments;
drop trigger if exists guard_discussion_submission on public.comments;
drop trigger if exists zz_guard_comment_revision on public.comments;
revoke execute on function public.discussion_interaction_state(uuid[]) from anon,authenticated,public;
revoke execute on function public.set_discussion_interaction(uuid,text,text) from anon,authenticated,public;
revoke execute on function public.set_discussion_chapter_closed(uuid,boolean) from anon,authenticated,public;
revoke select on public.discussion_closed_chapters from anon,authenticated,public;
commit;
