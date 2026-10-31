-- EPHEMERAL CI ONLY. Synthetic approximation of storage.object access inputs.
-- Names and RLS rules match the reviewed production storage policies;
-- this file does NOT stand up Supabase Storage or signed-URL behavior.
create schema storage;
create function storage.foldername(object_name text)
returns text[] language sql immutable as $$
  select (string_to_array(object_name,'/'))[1:array_length(string_to_array(object_name,'/'),1)-1]
$$;

create table storage.objects (
 id uuid primary key default gen_random_uuid(),
 bucket_id text not null,
 name text not null,
 unique(bucket_id,name)
);

alter table public.comics add column cover_path text;
alter table public.comics add column creator_id uuid;
update public.comics set creator_id='00000000-0000-0000-0000-000000000001';
create table public.comic_episodes(
 id uuid primary key, comic_id uuid references public.comics(id), status text
);
create table public.comic_pages(
 id uuid primary key, episode_id uuid references public.comic_episodes(id),
 reader_path text, original_path text
);

create table public.conversations(
 id uuid primary key, status text, direct_user_a uuid, direct_user_b uuid
);
create table public.conversation_members(
 conversation_id uuid, user_id uuid, left_at timestamptz
);
create table public.palace_group_chats(
 id uuid primary key, status text
);
create table public.palace_group_chat_members(
 chat_id uuid, user_id uuid, left_at timestamptz
);
create table private.test_block_pairs(a uuid,b uuid);

create function private.users_blocked(user_a uuid,user_b uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from private.test_block_pairs p
   where (p.a=user_a and p.b=user_b) or (p.a=user_b and p.b=user_a))
$$;
create function private.is_conversation_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from public.conversation_members cm
 where cm.conversation_id=p_conversation_id
 and cm.user_id=(select auth.uid()) and cm.left_at is null)
$$;
create function private.can_send_to_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(
   select 1 from public.conversations c
   where c.id=p_conversation_id and c.status='active'
     and ((c.direct_user_a=(select auth.uid()) and c.direct_user_b is not null)
       or (c.direct_user_b=(select auth.uid()) and c.direct_user_a is not null))
     and not private.users_blocked(c.direct_user_a,c.direct_user_b))
$$;
create function private.is_palace_group_member(p_chat uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from public.palace_group_chat_members m
   where m.chat_id=p_chat and m.user_id=(select auth.uid()) and m.left_at is null)
$$;
create function private.can_send_palace_group(p_chat uuid)
returns boolean language sql stable security definer set search_path to '' as $$
 select exists(select 1 from public.palace_group_chats c where c.id=p_chat and c.status='active')
   and private.is_palace_group_member(p_chat)
   and not exists(select 1 from public.palace_group_chat_members m
    where m.chat_id=p_chat and m.left_at is null
      and m.user_id<>(select auth.uid())
      and private.users_blocked((select auth.uid()),m.user_id))
$$;

-- Mirror exact logical conditions from live private helper.
create function private.can_access_palace_chat_photo(p_path text,p_sending boolean default false)
returns boolean language sql stable security definer set search_path to '' as $$
 select p_path is not null
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
   )
$$;

update public.comics
set cover_path=case
 when id='60000000-0000-0000-0000-000000000001'
 then '00000000-0000-0000-0000-000000000001/private-cover.webp'
 else '00000000-0000-0000-0000-000000000001/adult-cover.webp' end;
insert into public.comics(id,publication_status,visibility,minimum_reader_age,cover_path,creator_id)
values
 ('60000000-0000-0000-0000-000000000003','published','public',12,
 '00000000-0000-0000-0000-000000000001/public-cover.webp','00000000-0000-0000-0000-000000000001'),
 ('60000000-0000-0000-0000-000000000004','published','members',13,
 '00000000-0000-0000-0000-000000000001/members-cover.webp','00000000-0000-0000-0000-000000000001');
insert into public.comic_episodes(id,comic_id,status) values
 ('61000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','published'),
 ('61000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','published'),
 ('61000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000003','draft');
insert into public.comic_pages(id,episode_id,reader_path,original_path) values
 ('62000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001/public-reader.webp',
 '00000000-0000-0000-0000-000000000001/public-original.png'),
 ('62000000-0000-0000-0000-000000000002','61000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001/adult-reader.webp',
 '00000000-0000-0000-0000-000000000001/adult-original.png'),
 ('62000000-0000-0000-0000-000000000003','61000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001/draft-reader.webp',
 '00000000-0000-0000-0000-000000000001/draft-original.png');

insert into public.conversations(id,status,direct_user_a,direct_user_b) values
 ('70000000-0000-0000-0000-000000000001','active',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
insert into public.conversation_members values
 ('70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',null),
 ('70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',null);
insert into public.palace_group_chats values
 ('71000000-0000-0000-0000-000000000001','active');
insert into public.palace_group_chat_members values
 ('71000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',null),
 ('71000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',null);

-- Fixture rows are created as admin; no real image bytes are present.
insert into storage.objects(bucket_id,name) values
 ('comic-covers','00000000-0000-0000-0000-000000000001/public-cover.webp'),
 ('comic-covers','00000000-0000-0000-0000-000000000001/adult-cover.webp'),
 ('comic-covers','00000000-0000-0000-0000-000000000001/private-cover.webp'),
 ('comic-covers','00000000-0000-0000-0000-000000000001/members-cover.webp'),
 ('comic-pages','00000000-0000-0000-0000-000000000001/public-reader.webp'),
 ('comic-pages','00000000-0000-0000-0000-000000000001/adult-reader.webp'),
 ('comic-pages','00000000-0000-0000-0000-000000000001/draft-reader.webp'),
 ('comic-originals','00000000-0000-0000-0000-000000000001/public-original.png'),
 ('comic-originals','00000000-0000-0000-0000-000000000001/draft-original.png'),
 ('palace-chat-photos','direct/70000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000001/72000000-0000-0000-0000-000000000001.webp'),
 ('palace-chat-photos','group/71000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000001/72000000-0000-0000-0000-000000000002.webp');
