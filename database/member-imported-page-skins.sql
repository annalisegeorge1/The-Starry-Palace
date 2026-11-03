-- Add owner-controlled imported colour skins to member chambers.
-- No HTML, stylesheets, scripts, or cross-user styles are accepted.
create table if not exists public.member_page_skins (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 48),
 colors jsonb not null,
 updated_at timestamptz not null default now(),
 constraint member_page_skins_color_tokens check (
  jsonb_typeof(colors)='object'
  and colors->>'background' ~ '^#[A-Fa-f0-9]{6}$'
  and colors->>'surface' ~ '^#[A-Fa-f0-9]{6}$'
  and colors->>'text' ~ '^#[A-Fa-f0-9]{6}$'
  and colors->>'muted' ~ '^#[A-Fa-f0-9]{6}$'
  and colors->>'accent' ~ '^#[A-Fa-f0-9]{6}$'
  and colors->>'border' ~ '^#[A-Fa-f0-9]{6}$'
 )
);
alter table public.member_page_skins enable row level security;
revoke all on public.member_page_skins from public, anon, authenticated;
grant select on public.member_page_skins to anon, authenticated;
grant insert, update, delete on public.member_page_skins to authenticated;
drop policy if exists "Read public or authorized member skin" on public.member_page_skins;
create policy "Read public or authorized member skin"
 on public.member_page_skins for select to anon,authenticated
 using (
  user_id=(select auth.uid()) or exists (
   select 1 from public.profiles p where p.id=user_id
    and (p.visibility='public'
       or (p.visibility='members' and (select auth.uid()) is not null))
  )
 );
drop policy if exists "Members create their own skin" on public.member_page_skins;
create policy "Members create their own skin"
 on public.member_page_skins for insert to authenticated
 with check (user_id=(select auth.uid()));
drop policy if exists "Members update their own skin" on public.member_page_skins;
create policy "Members update their own skin"
 on public.member_page_skins for update to authenticated
 using (user_id=(select auth.uid()))
 with check (user_id=(select auth.uid()));
drop policy if exists "Members delete their own skin" on public.member_page_skins;
create policy "Members delete their own skin"
 on public.member_page_skins for delete to authenticated
 using (user_id=(select auth.uid()));
