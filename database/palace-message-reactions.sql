-- Message reactions only; linked replies remain disabled.
create table public.palace_message_reactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 direct_message_id uuid references public.messages(id) on delete cascade,
 group_message_id uuid references public.palace_group_chat_messages(id) on delete cascade,
 reaction text not null check (reaction in ('heart','star','moon','crown','sparkle','laugh')),
 created_at timestamptz not null default now(),
 constraint palace_reactions_one_target check (num_nonnulls(direct_message_id,group_message_id)=1),
 constraint palace_reactions_direct_once unique(user_id,direct_message_id),
 constraint palace_reactions_group_once unique(user_id,group_message_id)
);
create index palace_reactions_user_lookup on public.palace_message_reactions(user_id);
create index palace_reactions_direct_lookup on public.palace_message_reactions(direct_message_id);
create index palace_reactions_group_lookup on public.palace_message_reactions(group_message_id);
alter table public.palace_message_reactions enable row level security;
revoke all on public.palace_message_reactions from PUBLIC, anon, authenticated;
grant select,insert,delete on public.palace_message_reactions to authenticated;

-- Use the same private membership predicates already relied upon by
-- messages/palace_group_chat_messages. Never use 'TO authenticated' alone.
create policy "members see direct or group reactions"
 on public.palace_message_reactions for select to authenticated
 using (
  (direct_message_id is not null and exists(
    select 1 from public.messages m
    where m.id=direct_message_id and m.status='active'
      and private.is_conversation_member(m.conversation_id)
  ))
  or
  (group_message_id is not null and exists(
    select 1 from public.palace_group_chat_messages gm
    where gm.id=group_message_id
      and private.is_palace_group_member(gm.chat_id)
  ))
 );
create policy "members react only as themselves"
 on public.palace_message_reactions for insert to authenticated
 with check (
  user_id=(select auth.uid()) and (
   (direct_message_id is not null and exists(
      select 1 from public.messages m
      where m.id=direct_message_id and m.status='active'
        and private.can_send_to_conversation(m.conversation_id)
        and private.is_conversation_member(m.conversation_id)
   ))
   or
   (group_message_id is not null and exists(
      select 1 from public.palace_group_chat_messages gm
      where gm.id=group_message_id and private.can_send_palace_group(gm.chat_id)
        and private.is_palace_group_member(gm.chat_id)
   ))
  )
 );
create policy "members delete own reactions"
 on public.palace_message_reactions for delete to authenticated
 using(user_id=(select auth.uid()));

