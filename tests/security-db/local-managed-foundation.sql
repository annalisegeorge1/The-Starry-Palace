-- Disposable Supabase CLI local integration fixture; NEVER apply to a hosted project.
-- Only this minimal schema is loaded, not real Palace members or manuscripts.
create schema if not exists private;

create table public.works (
  id uuid primary key,
  author_id uuid not null,
  publication_status text not null default 'draft',
  visibility text not null default 'private',
  minimum_reader_age integer not null default 13
);

create table public.work_collaborators (
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('co_writer','editor')),
  status text not null default 'invited'
    check (status in ('invited','accepted','declined','removed')),
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(work_id,user_id)
);

alter table public.works enable row level security;
alter table public.work_collaborators enable row level security;

create or replace function private.is_work_owner(p_work uuid)
returns boolean language sql stable security definer
set search_path = '' as $function$
  select exists(
    select 1 from public.works w
    where w.id=p_work and w.author_id=(select auth.uid())
  );
$function$;

create or replace function private.is_accepted_work_collaborator(p_work uuid)
returns boolean language sql stable security definer
set search_path = '' as $function$
  select exists(
    select 1 from public.work_collaborators c
    where c.work_id=p_work and c.user_id=(select auth.uid())
      and c.status='accepted'
  );
$function$;

create policy "owner or accepted collaborator reads manuscript" on public.works
for select to authenticated
using (author_id=(select auth.uid()) or private.is_accepted_work_collaborator(id));

create policy "authors invite collaborators" on public.work_collaborators
for insert to authenticated
with check (invited_by=(select auth.uid())
  and user_id<>(select auth.uid()) and private.is_work_owner(work_id));

create policy "authors remove collaborators" on public.work_collaborators
for delete to authenticated using (private.is_work_owner(work_id));

create policy "collaborators read collaboration" on public.work_collaborators
for select to authenticated
using (user_id=(select auth.uid()) or private.is_work_owner(work_id));

create policy "collaborators respond to invitation" on public.work_collaborators
for update to authenticated
using (user_id=(select auth.uid()) or private.is_work_owner(work_id))
with check (user_id=(select auth.uid()) or private.is_work_owner(work_id));

grant usage on schema private to authenticated;
grant select on public.works to authenticated;
grant select,insert,update,delete on public.work_collaborators to authenticated;
