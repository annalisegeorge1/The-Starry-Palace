-- Manual migration. Apply together with the revision-aware reader and writer desk.
begin;
alter table public.comments
 add column edit_revision integer not null default 0,
 add column reviewed_revision integer not null default 0,
 add column edited_at timestamptz;

-- Runs after enforce_comment_update_boundaries, which checks actor, routing,
-- ownership and the client's requested moderation transition.
create function private.guard_comment_revision() returns trigger
language plpgsql set search_path = '' as $$
declare
 content_changed boolean;
begin
 if tg_op = 'INSERT' then
  new.edit_revision := 0;
  new.reviewed_revision := 0;
  new.edited_at := null;
  return new;
 end if;
 content_changed := (new.body,new.spoiler,new.comment_type) is distinct from
                    (old.body,old.spoiler,old.comment_type);
 new.edited_at := old.edited_at;
 new.edit_revision := old.edit_revision;
 if content_changed then
  if auth.uid() is distinct from old.author_id or old.status='hidden' or not exists (
   select 1 from public.works where id=old.work_id and comment_policy<>'closed'
  ) then raise exception 'This comment cannot be edited.'; end if;
  new.status := 'pending';
  new.edit_revision := old.edit_revision+1;
  new.edited_at := statement_timestamp();
  new.updated_at := new.edited_at;
  new.reviewed_revision := old.reviewed_revision;
 elsif new.status is distinct from old.status then
  if new.reviewed_revision is distinct from old.edit_revision then
   raise exception 'This response changed. Reload it before moderation.';
  end if;
 else
  new.reviewed_revision := old.reviewed_revision;
 end if;
 return new;
end $$;
revoke all on function private.guard_comment_revision() from public, anon, authenticated;
create trigger zz_guard_comment_revision before insert or update on public.comments
 for each row execute function private.guard_comment_revision();
commit;
