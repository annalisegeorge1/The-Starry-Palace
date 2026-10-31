-- Hosted Supabase STAGING ONLY, never apply to the live Palace.
-- The bucket has zero real file bytes. All users and room IDs are invented.
-- This is a minimal membership/RLS test harness, not the complete production chat schema.

create table if not exists private.staging_chat_rooms (
  id uuid primary key,
  kind text not null check(kind in ('direct','group')),
  active boolean not null default true
);
create table if not exists private.staging_chat_members (
  room_id uuid not null references private.staging_chat_rooms(id) on delete cascade,
  user_id uuid not null,
  active boolean not null default true,
  primary key(room_id,user_id)
);
alter table private.staging_chat_rooms enable row level security;
alter table private.staging_chat_members enable row level security;

-- Search path is pinned, membership data is inaccessible to browser clients.
create or replace function private.staging_can_view_chat_photo(p_path text)
returns boolean language sql stable security definer
set search_path to '' as $function$
  select coalesce(
    p_path ~ '^(direct|group)/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$'
    and exists(
      select 1
      from private.staging_chat_rooms r
      join private.staging_chat_members m on m.room_id=r.id
      where r.id::text=split_part(p_path,'/',2)
        and r.kind=split_part(p_path,'/',1)
        and r.active and m.active
        and m.user_id=(select auth.uid())
    ),false);
$function$;
create or replace function private.staging_can_upload_chat_photo(p_path text)
returns boolean language sql stable security definer
set search_path to '' as $function$
  select private.staging_can_view_chat_photo(p_path)
     and split_part(p_path,'/',3)=(select auth.uid())::text;
$function$;
revoke all on function private.staging_can_view_chat_photo(text) from public, anon;
revoke all on function private.staging_can_upload_chat_photo(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.staging_can_view_chat_photo(text) to authenticated;
grant execute on function private.staging_can_upload_chat_photo(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('palace-security-fixture','palace-security-fixture',false,1048576,array['image/webp'])
on conflict (id) do update set public=false,file_size_limit=1048576,allowed_mime_types=array['image/webp'];

create policy "staging authorized member reads private media metadata"
on storage.objects for select to authenticated
using (bucket_id='palace-security-fixture'
 and private.staging_can_view_chat_photo(name));

create policy "staging active member uploads to own folder"
on storage.objects for insert to authenticated
with check (bucket_id='palace-security-fixture'
 and private.staging_can_upload_chat_photo(name));

-- No public SELECT, UPDATE, or DELETE policies are added for this bucket.
