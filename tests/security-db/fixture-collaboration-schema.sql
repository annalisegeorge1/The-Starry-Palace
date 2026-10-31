-- EPHEMERAL CI ONLY: reproduce live RLS permission expressions for invitations.
-- Use invented identities and no member manuscripts. No production access.
-- Match the live composite primary key so frontend ON CONFLICT upserts work.
alter table public.work_collaborators add constraint work_collaborators_pkey primary key(work_id,user_id);
alter table public.work_collaborators add column invited_by uuid;
alter table public.work_collaborators add column created_at timestamptz default now();
alter table public.work_collaborators add column responded_at timestamptz;
alter table public.work_collaborators add column updated_at timestamptz default now();

grant select,insert,update,delete on public.work_collaborators to authenticated;
alter table public.work_collaborators enable row level security;

create policy "authors invite collaborators" on public.work_collaborators
for insert to authenticated
with check (invited_by=(select auth.uid())
  and user_id<>(select auth.uid()) and private.is_work_owner(work_id));
create policy "collaborators read collaboration" on public.work_collaborators
for select to authenticated
using (user_id=(select auth.uid()) or private.is_work_owner(work_id));
create policy "collaborators respond to invitation" on public.work_collaborators
for update to authenticated
using (user_id=(select auth.uid()) or private.is_work_owner(work_id))
with check (user_id=(select auth.uid()) or private.is_work_owner(work_id));
create policy "authors remove collaborators" on public.work_collaborators
for delete to authenticated using (private.is_work_owner(work_id));

-- Proposed guard must be loaded before role-separated assertions.
