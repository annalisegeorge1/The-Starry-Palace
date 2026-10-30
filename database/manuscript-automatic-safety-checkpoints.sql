-- WRITING CHAMBER: preserve earlier chapter text automatically before substantial
-- manuscript edits; no publication, visibility, ownership or schedule changes.
-- Reuses the existing owner/collaborator-protected revision snapshot table.
-- Checkpoints are in the database, not the user's browser.
-- Lock down the snapshots table to the minimum app permissions.
-- The existing RLS owner/collaborator policies remain authoritative.
revoke all on public.chapter_revision_snapshots from public,anon,authenticated;
grant select,insert,delete on public.chapter_revision_snapshots to authenticated;
alter table public.chapter_revision_snapshots enable row level security;
create or replace function private.palace_chapter_safety_checkpoint()
returns trigger
language plpgsql
security definer
set search_path = ''
as $checkpoint$
declare
  v_editor uuid := auth.uid();
  v_recent timestamptz;
  v_important_reduction boolean;
begin
  -- A signed-in writer may change a draft through the existing chapter RLS.
  -- Background service updates without a user identity do not fabricate authors.
  if v_editor is null then return new; end if;
  if old.title is not distinct from new.title
    and old.body_html is not distinct from new.body_html
    and old.revision_note is not distinct from new.revision_note
  then return new; end if;
  -- Skip brand-new empty pages; they have no earlier manuscript to protect.
  if coalesce(old.body_html,'') = '' and coalesce(old.revision_note,'') = ''
  then return new; end if;

  select max(s.created_at) into v_recent
    from public.chapter_revision_snapshots s
    where s.chapter_id=old.id and s.label='Automatic safety checkpoint';

  v_important_reduction :=
    length(coalesce(old.body_html,'')) >= 200
    and length(coalesce(new.body_html,'')) < length(coalesce(old.body_html,''))*0.65;

  -- Avoid a full snapshot on every 900ms autosave. Always capture a major
  -- accidental deletion even inside the normal 20-minute window.
  if v_recent is not null
     and v_recent > now()-interval '20 minutes'
     and not v_important_reduction
  then return new; end if;

  insert into public.chapter_revision_snapshots
    (chapter_id,created_by,label,title,body_html,revision_note,word_count,source_revision)
  values
    (old.id,v_editor,'Automatic safety checkpoint',old.title,
     coalesce(old.body_html,''),old.revision_note,coalesce(old.word_count,0),old.revision);

  return new;
end
$checkpoint$;

revoke all on function private.palace_chapter_safety_checkpoint() from public,anon,authenticated;
drop trigger if exists palace_auto_manuscript_checkpoint on public.chapters;
create trigger palace_auto_manuscript_checkpoint
after update of title,body_html,revision_note on public.chapters
for each row
when (old.title is distinct from new.title
   or old.body_html is distinct from new.body_html
   or old.revision_note is distinct from new.revision_note)
execute function private.palace_chapter_safety_checkpoint();

comment on function private.palace_chapter_safety_checkpoint() is
'Creates a private pre-edit copy of earlier manuscript content, throttled to every 20 minutes except major deletions. Does not publish text or auto-restore it.';
