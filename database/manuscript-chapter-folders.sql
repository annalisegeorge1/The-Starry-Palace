-- Chapter folders supplement the existing chapter positions, never modify chapter content.
-- Only a work's author can change its private organising folders.
create table if not exists public.manuscript_chapter_folders(
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  name text not null check(char_length(btrim(name)) between 1 and 55),
  tint text not null default 'violet' check(tint in ('violet','sapphire','teal','rose','silver','mint')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists manuscript_chapter_folders_work_idx on public.manuscript_chapter_folders(work_id);
create unique index if not exists manuscript_chapter_folders_name_unique
 on public.manuscript_chapter_folders(work_id,lower(btrim(name)));

create table if not exists public.manuscript_chapter_filing(
 chapter_id uuid primary key references public.chapters(id) on delete cascade,
 work_id uuid not null references public.works(id) on delete cascade,
 folder_id uuid not null references public.manuscript_chapter_folders(id) on delete cascade,
 updated_at timestamptz not null default now()
);
create index if not exists manuscript_chapter_filing_folder_idx on public.manuscript_chapter_filing(folder_id);

alter table public.manuscript_chapter_folders enable row level security;
alter table public.manuscript_chapter_filing enable row level security;
revoke all on public.manuscript_chapter_folders,public.manuscript_chapter_filing from public,anon,authenticated;

create or replace function public.get_manuscript_folders(p_work uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_folders jsonb;v_filing jsonb;
begin
 if v_user is null or not exists(select 1 from public.works where id=p_work and author_id=v_user)
 then raise exception 'Only the work owner can arrange private chapter folders.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'tint',f.tint)
 order by f.created_at,f.id),'[]'::jsonb)
 into v_folders from public.manuscript_chapter_folders f where f.work_id=p_work;
 select coalesce(jsonb_agg(jsonb_build_object('chapter_id',c.chapter_id,'folder_id',c.folder_id)),'[]'::jsonb)
 into v_filing from public.manuscript_chapter_filing c
 join public.chapters ch on ch.id=c.chapter_id and ch.work_id=c.work_id
 join public.manuscript_chapter_folders f on f.id=c.folder_id and f.work_id=c.work_id
 where c.work_id=p_work;
 return jsonb_build_object('folders',v_folders,'filing',v_filing);
end $$;

create or replace function public.edit_manuscript_folder(
 p_work uuid,p_action text,p_folder uuid default null,p_name text default null,p_tint text default 'violet'
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_new uuid;
begin
 if v_user is null or not exists(select 1 from public.works where id=p_work and author_id=v_user)
 then raise exception 'Only the work owner can change chapter folders.';end if;
 -- Prevent simultaneous creations or duplicate names from slipping between writes.
 perform pg_advisory_xact_lock(hashtext(p_work::text),8001263);
 if p_action='create' then
   if (select count(*) from public.manuscript_chapter_folders where work_id=p_work)>=16
   then raise exception 'A manuscript can have up to 16 folders.';end if;
   if char_length(btrim(coalesce(p_name,''))) not between 1 and 55 or
    p_tint not in ('violet','sapphire','teal','rose','silver','mint')
   then raise exception 'Enter a folder name and a valid colour.';end if;
   insert into public.manuscript_chapter_folders(work_id,name,tint)
   values(p_work,btrim(p_name),p_tint) returning id into v_new;
 elsif p_action='rename' then
   if p_folder is null or char_length(btrim(coalesce(p_name,''))) not between 1 and 55 or
    p_tint not in ('violet','sapphire','teal','rose','silver','mint')
   then raise exception 'Enter a folder name and colour.';end if;
   update public.manuscript_chapter_folders set name=btrim(p_name),tint=p_tint,updated_at=now()
   where id=p_folder and work_id=p_work returning id into v_new;
   if v_new is null then raise exception 'Folder not found.';end if;
 elsif p_action='remove' then
   delete from public.manuscript_chapter_folders where id=p_folder and work_id=p_work returning id into v_new;
   if v_new is null then raise exception 'Folder not found.';end if;
 else raise exception 'Unrecognised folder action.';end if;
 return public.get_manuscript_folders(p_work);
end $$;

create or replace function public.file_manuscript_chapter(p_chapter uuid,p_folder uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_work uuid;
begin
 if v_user is null then raise exception 'Sign in to arrange your manuscript.';end if;
 select ch.work_id into v_work from public.chapters ch
 join public.works w on w.id=ch.work_id and w.author_id=v_user
 where ch.id=p_chapter;
 if v_work is null then raise exception 'Chapter not found in your own manuscript.';end if;
 if p_folder is null then
  delete from public.manuscript_chapter_filing where chapter_id=p_chapter and work_id=v_work;
 else
  if not exists(select 1 from public.manuscript_chapter_folders where id=p_folder and work_id=v_work)
  then raise exception 'This folder does not belong to the same manuscript.';end if;
  insert into public.manuscript_chapter_filing(chapter_id,work_id,folder_id)
  values(p_chapter,v_work,p_folder)
  on conflict(chapter_id) do update set work_id=excluded.work_id,
   folder_id=excluded.folder_id,updated_at=now();
 end if;
 return public.get_manuscript_folders(v_work);
end $$;

revoke all on function public.get_manuscript_folders(uuid) from public,anon;
revoke all on function public.edit_manuscript_folder(uuid,text,uuid,text,text) from public,anon;
revoke all on function public.file_manuscript_chapter(uuid,uuid) from public,anon;
grant execute on function public.get_manuscript_folders(uuid) to authenticated;
grant execute on function public.edit_manuscript_folder(uuid,text,uuid,text,text) to authenticated;
grant execute on function public.file_manuscript_chapter(uuid,uuid) to authenticated;
