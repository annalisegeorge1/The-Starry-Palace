-- Private, self-declared date of birth and row-level reader age gates.
-- Apply only after review; this branch migration has not been run on production.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create table if not exists private.member_age (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date not null
);
alter table private.member_age enable row level security;
revoke all on private.member_age from anon, authenticated, public;

create or replace function private.member_meets_age(p_minimum_age integer)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select case when (select auth.uid()) is null then coalesce(p_minimum_age,12) <= 12
    else exists (
      select 1 from private.member_age a
      where a.user_id = (select auth.uid())
        and (a.birth_date + make_interval(years => greatest(coalesce(p_minimum_age,12),12)))::date <= current_date
    )
  end;
$$;
revoke all on function private.member_meets_age(integer) from public;
grant execute on function private.member_meets_age(integer) to anon, authenticated;

create or replace function public.palace_age_status()
returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then 'signed_out'
    when not exists (select 1 from private.member_age a where a.user_id=(select auth.uid())) then 'needs_birth_date'
    when exists (select 1 from private.member_age a where a.user_id=(select auth.uid()) and (a.birth_date + interval '12 years')::date <= current_date) then 'eligible'
    else 'under_minimum'
  end;
$$;
revoke all on function public.palace_age_status() from public, anon;
grant execute on function public.palace_age_status() to authenticated;

create or replace function public.set_my_palace_birth_date(p_birth_date date)
returns text
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in to continue.'; end if;
  if p_birth_date is null or p_birth_date > current_date then raise exception 'Enter a valid date of birth.'; end if;
  if (p_birth_date + interval '12 years')::date > current_date then
    raise exception 'The Palace requires members to be at least 12 years old.';
  end if;
  insert into private.member_age(user_id,birth_date)
  values ((select auth.uid()),p_birth_date)
  on conflict (user_id) do nothing;
  return public.palace_age_status();
end;
$$;
revoke all on function public.set_my_palace_birth_date(date) from public, anon;
grant execute on function public.set_my_palace_birth_date(date) to authenticated;

create or replace function public.require_palace_signup_age()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare entered date;
begin
  begin
    entered := (new.raw_user_meta_data ->> 'palace_birth_date')::date;
  exception when others then
    raise exception 'Enter a valid date of birth to create a Palace account.';
  end;
  if entered is null or entered > current_date or (entered + interval '12 years')::date > current_date then
    raise exception 'The Palace requires members to be at least 12 years old.';
  end if;
  return new;
end;
$$;
revoke all on function public.require_palace_signup_age() from public, anon, authenticated;
drop trigger if exists require_palace_signup_age on auth.users;
create trigger require_palace_signup_age before insert on auth.users
for each row execute function public.require_palace_signup_age();

create or replace function public.store_palace_signup_age()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into private.member_age(user_id,birth_date)
  values(new.id,(new.raw_user_meta_data ->> 'palace_birth_date')::date)
  on conflict(user_id) do nothing;
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'palace_birth_date' where id=new.id;
  return new;
end;
$$;
revoke all on function public.store_palace_signup_age() from public, anon, authenticated;
drop trigger if exists store_palace_signup_age on auth.users;
create trigger store_palace_signup_age after insert on auth.users
for each row execute function public.store_palace_signup_age();

create or replace function private.minimum_age_for_rating(p_rating text)
returns integer language sql immutable set search_path = '' as $$
  select case p_rating when 'teen' then 13 when 'mature' then 16 when 'explicit' then 18 else 12 end;
$$;

alter table public.works add column if not exists minimum_reader_age integer not null default 12;
alter table public.comics add column if not exists minimum_reader_age integer not null default 12;
update public.works set minimum_reader_age=private.minimum_age_for_rating(rating) where minimum_reader_age=12;
update public.comics set minimum_reader_age=private.minimum_age_for_rating(rating) where minimum_reader_age=12;
alter table public.works add constraint works_minimum_reader_age_allowed check (minimum_reader_age in (12,13,16,18));
alter table public.works add constraint works_minimum_reader_age_matches_rating check (minimum_reader_age >= private.minimum_age_for_rating(rating));
alter table public.comics add constraint comics_minimum_reader_age_allowed check (minimum_reader_age in (12,13,16,18));
alter table public.comics add constraint comics_minimum_reader_age_matches_rating check (minimum_reader_age >= private.minimum_age_for_rating(rating));
revoke all on function private.minimum_age_for_rating(text) from public;
grant execute on function private.minimum_age_for_rating(text) to anon, authenticated;

create or replace function private.can_read_chapter(p_work uuid,p_chapter_status text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.can_edit_shared_work(p_work)
    or exists(select 1 from public.works w where w.id=p_work
      and w.publication_status='published' and p_chapter_status='published'
      and (w.visibility='public' or (w.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(w.minimum_reader_age));
$$;

drop policy if exists "read accessible works" on public.works;
create policy "read accessible works" on public.works for select using (
  author_id=(select auth.uid()) or private.is_accepted_work_collaborator(id)
  or (publication_status='published' and (visibility='public' or (visibility='members' and (select auth.uid()) is not null)) and private.member_meets_age(minimum_reader_age))
);

drop policy if exists "published comics are readable" on public.comics;
create policy "published comics are readable" on public.comics for select using (
  creator_id=(select auth.uid()) or (publication_status='published'
    and (visibility='public' or (visibility='members' and (select auth.uid()) is not null))
    and private.member_meets_age(minimum_reader_age))
);

drop policy if exists "comic episodes readable" on public.comic_episodes;
create policy "comic episodes readable" on public.comic_episodes for select using (
  exists(select 1 from public.comics c where c.id=comic_episodes.comic_id and (
    c.creator_id=(select auth.uid()) or (c.publication_status='published' and comic_episodes.status='published'
      and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(c.minimum_reader_age))))
);
drop policy if exists "comic pages readable" on public.comic_pages;
create policy "comic pages readable" on public.comic_pages for select using (
  exists(select 1 from public.comic_episodes e join public.comics c on c.id=e.comic_id
    where e.id=comic_pages.episode_id and (c.creator_id=(select auth.uid()) or
      (c.publication_status='published' and e.status='published'
        and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
        and private.member_meets_age(c.minimum_reader_age))))
);

drop policy if exists "comments readable by public owner or commenter" on public.comments;
create policy "comments readable by public owner or commenter" on public.comments for select using (
  author_id=(select auth.uid())
  or exists(select 1 from public.works w where w.id=comments.work_id and w.author_id=(select auth.uid()))
  or (status='approved' and exists(select 1 from public.works w where w.id=comments.work_id
      and w.publication_status='published'
      and (w.visibility='public' or (w.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(w.minimum_reader_age)))
);
drop policy if exists "members create comments" on public.comments;
create policy "members create comments" on public.comments for insert with check (
  author_id=(select auth.uid()) and status='pending'
  and exists(select 1 from public.works w where w.id=comments.work_id and w.publication_status='published'
    and w.comment_policy<>'closed' and (w.visibility='public' or w.visibility='members' or w.author_id=(select auth.uid()))
    and private.member_meets_age(w.minimum_reader_age))
  and (comment_type<>'critique' or exists(select 1 from public.works w where w.id=comments.work_id and w.constructive_criticism=true))
);

drop policy if exists "work tags readable" on public.work_tags;
create policy "work tags readable" on public.work_tags for select using (
  exists(select 1 from public.works w where w.id=work_tags.work_id and (w.author_id=(select auth.uid()) or
    (w.publication_status='published' and (w.visibility='public' or (w.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(w.minimum_reader_age))))
);
drop policy if exists "comic tags readable" on public.comic_tags;
create policy "comic tags readable" on public.comic_tags for select using (
  exists(select 1 from public.comics c where c.id=comic_tags.comic_id and (c.creator_id=(select auth.uid()) or
    (c.publication_status='published' and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(c.minimum_reader_age))))
);

drop policy if exists "members request comic downloads" on public.comic_download_requests;
create policy "members request comic downloads" on public.comic_download_requests for insert with check (
  requester_id=(select auth.uid()) and status='pending'
  and exists(select 1 from public.comics c where c.id=comic_download_requests.comic_id
    and c.creator_id<>(select auth.uid()) and c.download_policy='ask' and c.publication_status='published'
    and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
    and private.member_meets_age(c.minimum_reader_age))
);

create or replace function public.get_work_lore(p_work_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_owner uuid; v_progress_chapter uuid;
  v_progress_position integer := 0; v_result jsonb;
begin
  select author_id into v_owner from public.works where id=p_work_id;
  if v_owner is null then return '[]'::jsonb; end if;
  select rp.chapter_id into v_progress_chapter from public.reading_progress rp where rp.user_id=v_user and rp.work_id=p_work_id;
  if v_progress_chapter is not null then select position into v_progress_position from public.chapters where id=v_progress_chapter; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',l.id,'work_id',l.work_id,'kind',l.kind,'title',l.title,'summary',l.summary,
    'body',case when v_user=v_owner then l.body when l.reveal_mode in ('public','spoiler') then l.body
      when l.reveal_mode='after_chapter' and coalesce((select position from public.chapters where id=l.unlock_chapter_id),999999)<=v_progress_position then l.body else '' end,
    'reveal_mode',l.reveal_mode,'unlock_chapter_id',l.unlock_chapter_id,
    'unlocked',case when v_user=v_owner then true when l.reveal_mode in ('public','spoiler') then true
      when l.reveal_mode='after_chapter' and coalesce((select position from public.chapters where id=l.unlock_chapter_id),999999)<=v_progress_position then true else false end,
    'unlock_chapter',(select jsonb_build_object('id',c.id,'title',c.title,'position',c.position) from public.chapters c where c.id=l.unlock_chapter_id),
    'sort_order',l.sort_order) order by l.kind,l.sort_order,l.title),'[]'::jsonb)
  into v_result from public.work_lore_entries l join public.works w on w.id=l.work_id
  where l.work_id=p_work_id and (v_user=v_owner or (
    w.publication_status='published' and (w.visibility='public' or (w.visibility='members' and v_user is not null))
    and private.member_meets_age(w.minimum_reader_age) and l.reveal_mode<>'private'));
  return v_result;
end;
$$;

drop policy if exists "read accessible comic covers" on storage.objects;
create policy "read accessible comic covers" on storage.objects for select using (
  bucket_id='comic-covers' and exists(select 1 from public.comics c where c.cover_path=objects.name
    and c.publication_status='published' and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
    and private.member_meets_age(c.minimum_reader_age))
);
drop policy if exists "read accessible comic reader pages" on storage.objects;
create policy "read accessible comic reader pages" on storage.objects for select using (
  bucket_id='comic-pages' and exists(select 1 from public.comic_pages p
    join public.comic_episodes e on e.id=p.episode_id join public.comics c on c.id=e.comic_id
    where p.reader_path=objects.name and c.publication_status='published' and e.status='published'
      and (c.visibility='public' or (c.visibility='members' and (select auth.uid()) is not null))
      and private.member_meets_age(c.minimum_reader_age))
);

