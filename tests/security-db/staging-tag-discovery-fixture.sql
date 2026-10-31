-- Fully synthetic hosted staging fixture for tag discovery only.
-- No production tag labels, member content, or identifiable metadata is copied.
create extension if not exists pg_trgm with schema extensions;
create table if not exists public.tags(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null,
 status text not null default 'canonical'
);
create table if not exists public.comics (
 id uuid primary key,
 publication_status text not null default 'draft',
 visibility text not null default 'private',
 minimum_reader_age integer not null default 13
);
create table if not exists public.work_tags(
 work_id uuid not null references public.works(id),
 tag_id uuid not null references public.tags(id),
 primary key (work_id,tag_id)
);
create table if not exists public.comic_tags(
 comic_id uuid not null references public.comics(id),
 tag_id uuid not null references public.tags(id),
 primary key (comic_id,tag_id)
);
alter table public.tags enable row level security;
alter table public.comics enable row level security;
alter table public.work_tags enable row level security;
alter table public.comic_tags enable row level security;
create index if not exists staging_wt_tag_idx on public.work_tags(tag_id,work_id);
create index if not exists staging_ct_tag_idx on public.comic_tags(tag_id,comic_id);
