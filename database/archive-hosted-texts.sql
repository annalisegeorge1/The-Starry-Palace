-- Palace Classics: hosted text layer for rights-verified archive works.
-- Full/excerpt text is readable only when its archive record is published and
-- the existing rights model marks the work creator-authorised, licensed, or
-- public-domain verified.

create table if not exists public.archive_texts (
  record_id uuid primary key references public.archive_records(id) on delete cascade,
  body_text text not null,
  source_url text not null,
  source_title text not null default '',
  source_license text not null default '',
  edition_note text not null default '',
  first_publication_year integer,
  word_count integer not null default 0 check (word_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.archive_texts enable row level security;

revoke all on table public.archive_texts from anon, authenticated;
grant select on table public.archive_texts to anon, authenticated;

drop policy if exists "hosted archive texts readable" on public.archive_texts;
create policy "hosted archive texts readable"
on public.archive_texts
for select
to anon, authenticated
using (
  private.can_curate_archive()
  or exists (
    select 1
    from public.archive_records r
    where r.id = archive_texts.record_id
      and r.publication_status = 'published'
      and r.host_mode in ('full','excerpt')
      and r.rights_status in ('creator_authorised','licensed','public_domain_verified')
  )
);
