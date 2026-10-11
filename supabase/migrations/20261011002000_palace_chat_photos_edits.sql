-- Palace Chat photos and message edits (additive migration).
-- Photo bucket is PRIVATE. Storage SELECT is restricted to active members.
alter table public.messages add column if not exists media_path text;
alter table public.palace_group_chat_messages add column if not exists media_path text;
alter table public.palace_group_chat_messages add column if not exists edited_at timestamptz;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('palace-chat-photos','palace-chat-photos',false,6291456,array['image/webp'])
on conflict (id) do update set public=false,file_size_limit=6291456,allowed_mime_types=array['image/webp'];

create or replace function private.can_access_palace_chat_photo(p_path text,p_sending boolean default false)
returns boolean language sql stable security definer set search_path to ''
as $$
 select
  p_path is not null
  and array_length(string_to_array(p_path,'/'),1)=4
  and split_part(p_path,'/',4) ~ '^[0-9a-f-]{36}[.]webp$'
  and (
   (split_part(p_path,'/',1)='direct' and exists(
    select 1 from public.conversations c
    where c.id::text=split_part(p_path,'/',2)
      and private.is_conversation_member(c.id)
      and (not p_sending or private.can_send_to_conversation(c.id))
   ))
   or
   (split_part(p_path,'/',1)='group' and exists(
    select 1 from public.palace_group_chats c
    where c.id::text=split_part(p_path,'/',2)
      and private.is_palace_group_member(c.id)
      and (not p_sending or private.can_send_palace_group(c.id))
   ))
  );
$$;
revoke all on function private.can_access_palace_chat_photo(text,boolean) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.can_access_palace_chat_photo(text,boolean) to authenticated;

drop policy if exists "conversation members read chat photos" on storage.objects;
create policy "conversation members read chat photos" on storage.objects
 for select to authenticated using (
  bucket_id='palace-chat-photos'
  and private.can_access_palace_chat_photo(name,false)
 );

drop policy if exists "active members upload own chat photos" on storage.objects;
create policy "active members upload own chat photos" on storage.objects
 for insert to authenticated with check (
  bucket_id='palace-chat-photos'
  and (storage.foldername(name))[3]=(select auth.uid())::text
  and private.can_access_palace_chat_photo(name,true)
 );

drop policy if exists "senders remove own chat photos" on storage.objects;
create policy "senders remove own chat photos" on storage.objects
 for delete to authenticated using (
  bucket_id='palace-chat-photos'
  and (storage.foldername(name))[3]=(select auth.uid())::text
  and private.can_access_palace_chat_photo(name,false)
 );

-- The referenced asset must belong to the sending member and message's room.
-- Existing plain-text messages remain valid without a media_path.
create or replace function private.guard_palace_chat_photo_reference()
returns trigger language plpgsql set search_path to ''
as $$
declare
 v_kind text;
 v_room uuid;
 v_user uuid;
begin
 if tg_table_name='messages' then
   v_kind:='direct';v_room:=new.conversation_id;v_user:=new.sender_id;
 else
   v_kind:='group';v_room:=new.chat_id;v_user:=new.sender_id;
 end if;
 if tg_op='UPDATE' then
   if new.media_path is distinct from old.media_path then
     raise exception 'A sent message photo cannot be changed.';
   end if;
   return new;
 end if;
 if new.media_path is not null then
  if new.media_path !~ ('^'||v_kind||'/'||v_room::text||'/'||v_user::text||'/[0-9a-f-]{36}[.]webp$')
    or not private.can_access_palace_chat_photo(new.media_path,true)
    or not exists(select 1 from storage.objects o where o.bucket_id='palace-chat-photos' and o.name=new.media_path)
  then raise exception 'This photo is not accessible in the conversation.';end if;
 end if;
 return new;
end;
$$;

drop trigger if exists guard_chat_photo_reference on public.messages;
create trigger guard_chat_photo_reference before insert or update on public.messages
 for each row execute function private.guard_palace_chat_photo_reference();
drop trigger if exists guard_group_photo_reference on public.palace_group_chat_messages;
create trigger guard_group_photo_reference before insert or update on public.palace_group_chat_messages
 for each row execute function private.guard_palace_chat_photo_reference();

-- Only the author can change message body. All other fields stay immutable.
create or replace function private.guard_palace_group_message_edit()
returns trigger language plpgsql set search_path to ''
as $$
begin
 if new.id is distinct from old.id
    or new.chat_id is distinct from old.chat_id
    or new.sender_id is distinct from old.sender_id
    or new.created_at is distinct from old.created_at
    or new.reply_to_id is distinct from old.reply_to_id
    or new.shared_work_id is distinct from old.shared_work_id
    or new.media_path is distinct from old.media_path
 then raise exception 'Message metadata is immutable.';end if;
 if old.sender_id is distinct from (select auth.uid()) then raise exception 'You may edit only your messages.';end if;
 if length(new.body)>3000 or btrim(new.body)='' then raise exception 'Message must be 1–3000 characters.';end if;
 if new.body is distinct from old.body then
  new.edited_at:=now();
 else
  new.edited_at:=old.edited_at;
 end if;
 return new;
end;
$$;
drop trigger if exists guard_group_message_edit on public.palace_group_chat_messages;
create trigger guard_group_message_edit before update on public.palace_group_chat_messages
 for each row execute function private.guard_palace_group_message_edit();

drop policy if exists "authors edit their group messages" on public.palace_group_chat_messages;
create policy "authors edit their group messages"
 on public.palace_group_chat_messages for update to authenticated
 using (sender_id=(select auth.uid()) and private.can_send_palace_group(chat_id))
 with check (sender_id=(select auth.uid()) and private.can_send_palace_group(chat_id));

grant update(body) on public.palace_group_chat_messages to authenticated;
