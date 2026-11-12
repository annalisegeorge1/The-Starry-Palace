-- Roll the Worker back first so active clients can still call the publication endpoint.
begin;
drop trigger guard_chapter_release_fields on public.chapters;
drop function private.guard_chapter_release_fields();
drop function public.publish_manuscript_chapter(uuid,timestamptz);
notify pgrst, 'reload schema';
commit;
