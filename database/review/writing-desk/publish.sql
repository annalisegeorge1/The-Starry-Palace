-- Install before deploying the new writer client. Existing clients keep their interface.
begin;

create function public.publish_manuscript_chapter(p_chapter_id uuid, p_expected_updated_at timestamptz)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  found_chapter public.chapters%rowtype;
  released_at timestamptz;
begin
  select ch.* into found_chapter
    from public.chapters ch
    join public.works w on w.id = ch.work_id
   where ch.id = p_chapter_id and w.author_id = (select auth.uid())
   for update of ch;
  if not found then
    raise exception 'Only the work owner can publish this chapter.';
  end if;
  if p_expected_updated_at is null or found_chapter.updated_at is distinct from p_expected_updated_at then
    raise exception 'This chapter changed. Reopen it and review the latest version before publishing.';
  end if;
  if found_chapter.status = 'published' then
    raise exception 'This chapter is already published. Reopen it to see its release.';
  end if;
  if nullif(btrim(found_chapter.title), '') is null or
     regexp_replace(regexp_replace(found_chapter.body_html, '<[^>]*>', ' ', 'g'), '[[:space:]]', '', 'g') = '' then
    raise exception 'Give the chapter a title and some text before publishing.';
  end if;
  released_at := greatest(clock_timestamp(), found_chapter.updated_at + interval '1 microsecond');
  update public.chapters set status = 'published', scheduled_for = null,
         published_at = released_at, updated_at = released_at where id = p_chapter_id;
  if not found then raise exception 'Chapter publication was interrupted.'; end if;
  update public.works set publication_status = 'published',
         first_published_at = coalesce(first_published_at, released_at),
         last_published_at = greatest(last_published_at, released_at), updated_at = greatest(updated_at, released_at)
   where id = found_chapter.work_id and author_id = (select auth.uid());
  if not found then raise exception 'Work publication was interrupted.'; end if;
end;
$$;
revoke all on function public.publish_manuscript_chapter(uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.publish_manuscript_chapter(uuid,timestamptz) to authenticated;

-- Keep authenticated collaborator edits within the existing owner-only release contract.
create function private.guard_chapter_release_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'draft' and new.scheduled_for is null and new.published_at is null then return new; end if;
  elsif new.status is not distinct from old.status
     and new.scheduled_for is not distinct from old.scheduled_for
     and new.published_at is not distinct from old.published_at
     and new.work_id is not distinct from old.work_id then
    return new;
  elsif not private.is_work_owner(old.work_id) then
    raise exception 'Only the work owner can change chapter release settings.';
  end if;
  if not private.is_work_owner(new.work_id) then
    raise exception 'Only the work owner can change chapter release settings.';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_chapter_release_fields() from public, anon, authenticated;
create trigger guard_chapter_release_fields before insert or update on public.chapters
for each row execute function private.guard_chapter_release_fields();
notify pgrst, 'reload schema';
commit;
