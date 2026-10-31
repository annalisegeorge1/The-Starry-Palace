-- Synthetic-only hosted staging fixtures for the Palace praise visibility guard.
-- These are NOT full production tables. Do not run on production.
create table public.chapters(
 id uuid primary key, work_id uuid not null references public.works(id), status text not null
);
create table public.palace_praises(
 id uuid primary key,
 giver_id uuid not null,
 target_kind text not null,
 target_id uuid not null,
 praise_type text not null
);
create table private.member_age(user_id uuid primary key,birth_date date not null);
alter table public.chapters enable row level security;
alter table public.palace_praises enable row level security;
alter table private.member_age enable row level security;
create or replace function private.member_meets_age(p_minimum_age integer)
returns boolean language sql stable security definer
set search_path to '' as $body$
 select case
   when (select auth.uid()) is null then coalesce(p_minimum_age,12)<=12
   else exists(select 1 from private.member_age a
       where a.user_id=(select auth.uid()) and
       (a.birth_date+make_interval(years=>greatest(coalesce(p_minimum_age,12),12)))::date<=current_date)
 end;
$body$;
create or replace function private.can_read_chapter(p_work uuid,p_chapter_status text)
returns boolean language sql stable security definer
set search_path to '' as $body$
 select private.is_work_owner(p_work)
    or private.is_accepted_work_collaborator(p_work)
    or exists(select 1 from public.works w
              where w.id=p_work and w.publication_status='published'
                and p_chapter_status='published'
                and (w.visibility='public' or
                     (w.visibility='members' and (select auth.uid()) is not null))
                and private.member_meets_age(w.minimum_reader_age));
$body$;
