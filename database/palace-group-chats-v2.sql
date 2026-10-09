-- Palace Chat · Circles v2. Additive: existing DMs, groups and messages remain intact.
alter table public.palace_group_chats
  add column if not exists description text not null default '',
  add column if not exists color_key text not null default 'moonlit',
  add column if not exists pinned_message_id uuid references public.palace_group_chat_messages(id) on delete set null;
alter table public.palace_group_chats
  add constraint palace_group_chat_description_check check (char_length(description)<=360),
  add constraint palace_group_chat_color_check check (color_key in ('moonlit','lilac','glacier','tide','orchid','emerald','slate','aurora'));
alter table public.palace_group_chat_messages
  add column if not exists reply_to_id uuid references public.palace_group_chat_messages(id) on delete set null,
  add column if not exists shared_work_id uuid references public.works(id) on delete set null;
create index if not exists palace_group_chat_messages_reply_idx on public.palace_group_chat_messages(reply_to_id) where reply_to_id is not null;

-- Validate both structured references before the caller's insert is stored.
-- This function is invoker-rights and subject to the same RLS as the sender.
create or replace function private.verify_palace_group_message_refs()
returns trigger language plpgsql set search_path=''
as $fn$
begin
 if new.reply_to_id is not null and not exists (
   select 1 from public.palace_group_chat_messages m
   where m.id=new.reply_to_id and m.chat_id=new.chat_id)
 then raise exception 'The message you are replying to is not in this group.'; end if;
 if new.shared_work_id is not null and not exists (
   select 1 from public.works w
   where w.id=new.shared_work_id and w.publication_status='published')
 then raise exception 'Only published stories can be shared.'; end if;
 return new;
end; $fn$;
create trigger verify_palace_group_message_refs before insert on public.palace_group_chat_messages
 for each row execute function private.verify_palace_group_message_refs();

create or replace function public.set_palace_group_identity(
 p_chat uuid,p_title text,p_description text,p_color_key text)
returns void language plpgsql security definer set search_path=''
as $fn$
begin
 if (select auth.uid()) is null or not private.is_palace_group_owner(p_chat)
 then raise exception 'Only the group host can update its identity.'; end if;
 if char_length(trim(coalesce(p_title,''))) not between 3 and 80
 then raise exception 'Group names need 3 to 80 characters.'; end if;
 if char_length(coalesce(p_description,''))>360
 then raise exception 'Group descriptions are limited to 360 characters.'; end if;
 if coalesce(p_color_key,'') not in ('moonlit','lilac','glacier','tide','orchid','emerald','slate','aurora')
 then raise exception 'Choose a Palace colour.'; end if;
 update public.palace_group_chats set
  title=trim(p_title),description=trim(coalesce(p_description,'')),
  color_key=p_color_key,updated_at=now() where id=p_chat and status='active';
end; $fn$;

create or replace function public.pin_palace_group_message(p_chat uuid,p_message uuid)
returns void language plpgsql security definer set search_path=''
as $fn$
begin
 if (select auth.uid()) is null or not private.is_palace_group_owner(p_chat)
 then raise exception 'Only the group host can pin messages.'; end if;
 if p_message is not null and not exists (
    select 1 from public.palace_group_chat_messages m where m.chat_id=p_chat and m.id=p_message)
 then raise exception 'Only messages in this group can be pinned.'; end if;
 update public.palace_group_chats set pinned_message_id=p_message,updated_at=now()
 where id=p_chat and status='active';
end; $fn$;

-- In-app invitations use the existing Palace notifications service.
create or replace function private.notify_palace_group_invitation()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare v_title text;
begin
 if new.status<>'pending' or (tg_op='UPDATE' and old.status='pending') then return new; end if;
 select title into v_title from public.palace_group_chats where id=new.chat_id;
 perform private.create_notification(
  new.user_id,'invitation','An invitation to a Palace Circle',
  'You have been invited to '||coalesce(v_title,'a private group')||'.',
  'home','messages','Open Palace Chat','palace-group-invite:'||new.chat_id::text,
  jsonb_build_object('group_chat_id',new.chat_id)
 );
 return new;
end; $fn$;
create trigger notify_palace_group_invitation
 after insert or update of status on public.palace_group_chat_invites
 for each row execute function private.notify_palace_group_invitation();

-- Notify active, unmuted members only. Keep the message text out of notices.
create or replace function private.notify_palace_group_message()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare recipient record; v_title text; v_sender text;
begin
 select title into v_title from public.palace_group_chats where id=new.chat_id;
 select display_name into v_sender from public.profiles where id=new.sender_id;
 for recipient in select user_id from public.palace_group_chat_members
   where chat_id=new.chat_id and left_at is null and muted=false and user_id<>new.sender_id
 loop
  perform private.create_notification(
   recipient.user_id,'message','New message in '||left(coalesce(v_title,'Palace Circle'),75),
   coalesce(v_sender,'A Palace member')||' wrote in your group.',
   'home','messages','Open Palace Chat','palace-group-message:'||new.id::text||':'||recipient.user_id::text,
   jsonb_build_object('group_chat_id',new.chat_id,'message_id',new.id)
  );
 end loop;
 return new;
end; $fn$;
create trigger notify_palace_group_message after insert on public.palace_group_chat_messages
 for each row execute function private.notify_palace_group_message();

revoke all on function public.set_palace_group_identity(uuid,text,text,text) from public,anon;
revoke all on function public.pin_palace_group_message(uuid,uuid) from public,anon;
grant execute on function public.set_palace_group_identity(uuid,text,text,text),
 public.pin_palace_group_message(uuid,uuid) to authenticated;
