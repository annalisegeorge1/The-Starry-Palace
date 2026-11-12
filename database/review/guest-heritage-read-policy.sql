-- Review in staging before applying to production.
-- Existing published rows stay visible to guests. The role helper remains member-only.
begin;
alter policy "published heritage readable" on public.heritage_observances to authenticated;
create policy "guests read published heritage" on public.heritage_observances
 for select to anon using (editorial_status = 'published');
commit;
