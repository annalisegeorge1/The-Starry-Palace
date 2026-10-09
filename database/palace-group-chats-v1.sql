-- Palace private group conversations. Existing direct Palace Letters are untouched.
-- All invitations require acceptance; browser clients never insert memberships.
create table if not exists public.palace_group_chats (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 3 and 80),
 status text not null default 'active' check (status in ('active','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_message_at timestamptz
);
create table if not exists public.palace_group_chat_members (
 chat_id uuid not null references public.palace_group_chats(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 left_at timestamptz,
 muted boolean not null default false,
 last_read_at timestamptz,
 primary key(chat_id,user_id)
);
create table if not exists public.palace_group_chat_invites (
 chat_id uuid not null references public.palace_group_chats(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 invited_by uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 primary key(chat_id,user_id)
);
create table if not exists public.palace_group_chat_messages (
 id uuid primary key default gen_random_uuid(),
 chat_id uuid not null references public.palace_group_chats(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(trim(body)) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index if not exists palace_group_chat_members_active_idx on public.palace_group_chat_members(user_id,chat_id) where left_at is null;
create index if not exists palace_group_chat_invites_pending_idx on public.palace_group_chat_invites(user_id,chat_id) where status='pending';
create index if not exists palace_group_chat_messages_recent_idx on public.palace_group_chat_messages(chat_id,created_at desc);
create index if not exists palace_group_chats_activity_idx on public.palace_group_chats(last_message_at desc nulls last);

create or replace function private.is_palace_group_member(p_chat uuid)
returns boolean language sql stable security definer set search_path=''
as $fn$ select exists(select 1 from public.palace_group_chat_members m
 where m.chat_id=p_chat and m.user_id=(select auth.uid()) and m.left_at is null); $fn$;
create or replace function private.is_palace_group_owner(p_chat uuid)
returns boolean language sql stable security definer set search_path=''
as $fn$ select exists(select 1 from public.palace_group_chats c
 where c.id=p_chat and c.owner_id=(select auth.uid()) and c.status='active'); $fn$;
create or replace function private.is_palace_group_invitee(p_chat uuid)
returns boolean language sql stable security definer set search_path=''
as $fn$ select exists(select 1 from public.palace_group_chat_invites i
 where i.chat_id=p_chat and i.user_id=(select auth.uid()) and i.status='pending'); $fn$;
create or replace function private.can_send_palace_group(p_chat uuid)
returns boolean language sql stable security definer set search_path=''
as $fn$
 select exists(select 1 from public.palace_group_chats c where c.id=p_chat and c.status='active')
 and private.is_palace_group_member(p_chat)
 and not exists(select 1 from public.palace_group_chat_members m
    where m.chat_id=p_chat and m.left_at is null and m.user_id<>(select auth.uid())
      and private.users_blocked((select auth.uid()),m.user_id));
$fn$;

alter table public.palace_group_chats enable row level security;
alter table public.palace_group_chat_members enable row level security;
alter table public.palace_group_chat_invites enable row level security;
alter table public.palace_group_chat_messages enable row level security;
revoke all on public.palace_group_chats,public.palace_group_chat_members,public.palace_group_chat_invites,public.palace_group_chat_messages from public,anon,authenticated;
grant select on public.palace_group_chats,public.palace_group_chat_members,public.palace_group_chat_invites,public.palace_group_chat_messages to authenticated;
grant insert on public.palace_group_chat_messages to authenticated;
grant update(muted,last_read_at) on public.palace_group_chat_members to authenticated;

create policy "members or invited see group" on public.palace_group_chats
 for select to authenticated using (private.is_palace_group_member(id) or private.is_palace_group_invitee(id));
create policy "members see group roster" on public.palace_group_chat_members
 for select to authenticated using (private.is_palace_group_member(chat_id));
create policy "members update own quiet preferences" on public.palace_group_chat_members
 for update to authenticated using (user_id=(select auth.uid()) and left_at is null)
 with check (user_id=(select auth.uid()) and left_at is null and private.is_palace_group_member(chat_id));
create policy "invitee or owner sees invitations" on public.palace_group_chat_invites
 for select to authenticated using (user_id=(select auth.uid()) or private.is_palace_group_owner(chat_id));
create policy "members read group messages" on public.palace_group_chat_messages
 for select to authenticated using (private.is_palace_group_member(chat_id));
create policy "members send group messages" on public.palace_group_chat_messages
 for insert to authenticated with check (sender_id=(select auth.uid()) and private.can_send_palace_group(chat_id));

create or replace function public.create_palace_group_chat(p_title text,p_invitees uuid[])
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare v_uid uuid:=(select auth.uid()); v_id uuid; v_other uuid; v_count integer;
begin
 if v_uid is null then raise exception 'Sign in to create a group.'; end if;
 if char_length(trim(coalesce(p_title,''))) not between 3 and 80 then raise exception 'Group names need 3 to 80 characters.'; end if;
 select count(distinct x) into v_count from unnest(coalesce(p_invitees,array[]::uuid[])) x;
 if v_count not between 1 and 11 then raise exception 'Invite between 1 and 11 Palace members.'; end if;
 if v_count <> cardinality(p_invitees) then raise exception 'A member was selected more than once.'; end if;
 for v_other in select unnest(p_invitees) loop
   if v_other is null or v_other=v_uid or private.users_blocked(v_uid,v_other)
      or not exists(select 1 from public.profiles p where p.id=v_other and p.message_policy<>'closed')
   then raise exception 'One or more invited members cannot receive this invitation.'; end if;
 end loop;
 insert into public.palace_group_chats(owner_id,title) values (v_uid,trim(p_title)) returning id into v_id;
 insert into public.palace_group_chat_members(chat_id,user_id) values(v_id,v_uid);
 insert into public.palace_group_chat_invites(chat_id,user_id,invited_by)
  select v_id,x,v_uid from unnest(p_invitees) x;
 return v_id;
end; $fn$;

create or replace function public.invite_palace_group_member(p_chat uuid,p_user uuid)
returns void language plpgsql security definer set search_path=''
as $fn$
declare v_uid uuid:=(select auth.uid()); v_count integer;
begin
 if v_uid is null or not private.is_palace_group_owner(p_chat) then raise exception 'Only the group owner can invite members.'; end if;
 if p_user is null or p_user=v_uid or private.users_blocked(v_uid,p_user)
 or not exists(select 1 from public.profiles p where p.id=p_user and p.message_policy<>'closed')
 then raise exception 'This member cannot be invited.'; end if;
 if exists(select 1 from public.palace_group_chat_members m where m.chat_id=p_chat and m.user_id=p_user and m.left_at is null)
 then raise exception 'This member is already in the group.'; end if;
 select count(*) into v_count from (
   select user_id from public.palace_group_chat_members where chat_id=p_chat and left_at is null
   union
   select user_id from public.palace_group_chat_invites where chat_id=p_chat and status='pending'
 ) participants;
 if v_count>=12 and not exists(select 1 from public.palace_group_chat_invites where chat_id=p_chat and user_id=p_user and status='pending')
 then raise exception 'The group has reached 12 places, including pending invites.'; end if;
 insert into public.palace_group_chat_invites(chat_id,user_id,invited_by,status,created_at,responded_at)
 values(p_chat,p_user,v_uid,'pending',now(),null)
 on conflict (chat_id,user_id) do update set invited_by=excluded.invited_by,status='pending',created_at=now(),responded_at=null;
end; $fn$;

create or replace function public.respond_palace_group_invite(p_chat uuid,p_accept boolean)
returns void language plpgsql security definer set search_path=''
as $fn$
declare v_uid uuid:=(select auth.uid()); v_invite public.palace_group_chat_invites%rowtype;
begin
 if v_uid is null then raise exception 'Sign in to respond.'; end if;
 select * into v_invite from public.palace_group_chat_invites
 where chat_id=p_chat and user_id=v_uid and status='pending' for update;
 if not found then raise exception 'Invitation is no longer pending.'; end if;
 if not exists(select 1 from public.palace_group_chats where id=p_chat and status='active')
 then raise exception 'This group is closed.'; end if;
 if p_accept then
   if (select count(*) from public.palace_group_chat_members where chat_id=p_chat and left_at is null)>=12
   then raise exception 'This group is full.'; end if;
   if exists(select 1 from public.palace_group_chat_members m where m.chat_id=p_chat and m.left_at is null
      and private.users_blocked(v_uid,m.user_id))
   then raise exception 'A Palace boundary prevents joining this group.'; end if;
   insert into public.palace_group_chat_members(chat_id,user_id,joined_at,left_at,muted,last_read_at)
    values(p_chat,v_uid,now(),null,false,null)
    on conflict (chat_id,user_id) do update set joined_at=now(),left_at=null,muted=false,last_read_at=null;
 end if;
 update public.palace_group_chat_invites set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now()
 where chat_id=p_chat and user_id=v_uid;
end; $fn$;

create or replace function public.leave_palace_group_chat(p_chat uuid)
returns void language plpgsql security definer set search_path=''
as $fn$
declare v_uid uuid:=(select auth.uid()); v_successor uuid;
begin
 if v_uid is null or not private.is_palace_group_member(p_chat) then raise exception 'You are not in this group.'; end if;
 update public.palace_group_chat_members set left_at=now() where chat_id=p_chat and user_id=v_uid;
 if private.is_palace_group_owner(p_chat) then
   select user_id into v_successor from public.palace_group_chat_members
     where chat_id=p_chat and left_at is null order by joined_at,user_id limit 1;
   if v_successor is not null then
     update public.palace_group_chats set owner_id=v_successor,updated_at=now() where id=p_chat;
   else
     update public.palace_group_chats set status='closed',updated_at=now() where id=p_chat;
     update public.palace_group_chat_invites set status='declined',responded_at=now()
       where chat_id=p_chat and status='pending';
   end if;
 end if;
end; $fn$;

create or replace function public.remove_palace_group_member(p_chat uuid,p_user uuid)
returns void language plpgsql security definer set search_path=''
as $fn$
begin
 if not private.is_palace_group_owner(p_chat) or p_user=(select auth.uid())
 then raise exception 'Only the owner can remove another member.'; end if;
 update public.palace_group_chat_members set left_at=now()
 where chat_id=p_chat and user_id=p_user and left_at is null;
 update public.palace_group_chat_invites set status='declined',responded_at=now()
 where chat_id=p_chat and user_id=p_user and status='pending';
end; $fn$;

create or replace function public.rename_palace_group_chat(p_chat uuid,p_title text)
returns void language plpgsql security definer set search_path=''
as $fn$
begin
 if not private.is_palace_group_owner(p_chat) then raise exception 'Only the owner can rename this group.'; end if;
 if char_length(trim(coalesce(p_title,''))) not between 3 and 80 then raise exception 'Group names need 3 to 80 characters.'; end if;
 update public.palace_group_chats set title=trim(p_title),updated_at=now() where id=p_chat;
end; $fn$;

create or replace function private.touch_palace_group_on_message()
returns trigger language plpgsql security definer set search_path=''
as $fn$ begin update public.palace_group_chats set last_message_at=new.created_at,updated_at=now() where id=new.chat_id; return new; end; $fn$;
create trigger touch_palace_group_on_message after insert on public.palace_group_chat_messages
 for each row execute function private.touch_palace_group_on_message();

-- Explicit RPC grants are essential: SECURITY DEFINER alone never grants authority.
revoke all on function public.create_palace_group_chat(text,uuid[]) from public,anon;
revoke all on function public.invite_palace_group_member(uuid,uuid) from public,anon;
revoke all on function public.respond_palace_group_invite(uuid,boolean) from public,anon;
revoke all on function public.leave_palace_group_chat(uuid) from public,anon;
revoke all on function public.remove_palace_group_member(uuid,uuid) from public,anon;
revoke all on function public.rename_palace_group_chat(uuid,text) from public,anon;
grant execute on function public.create_palace_group_chat(text,uuid[]),
 public.invite_palace_group_member(uuid,uuid),public.respond_palace_group_invite(uuid,boolean),
 public.leave_palace_group_chat(uuid),public.remove_palace_group_member(uuid,uuid),
 public.rename_palace_group_chat(uuid,text) to authenticated;
