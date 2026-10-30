-- THE STARRY PALACE: MESSENGER V3 STAGING SCHEMA PROPOSAL
-- REVIEW ONLY. DO NOT EXECUTE AGAINST THE LIVE SUPABASE DATABASE.
-- Prerequisites: isolated staging project, successful restore backup,
-- authenticated/non-member/adversarial RLS tests, explicit release approval.
-- This is intentionally in database/, not supabase/migrations/.
begin;

-- Existing messages UPDATE permission currently permits changing columns beyond
-- message text. This expansion must restrict browser edits to body alone to
-- prevent an author relocating messages across rooms or mutating sender_id.
-- Review every existing write path on isolated staging before approving:
revoke update on public.messages from authenticated;
grant update (body) on public.messages to authenticated;

-- A directly quoted reply must never refer to a message in another conversation.
-- The composite foreign key enforces the invariant even if a client is malicious.
create unique index if not exists messages_id_conversation_unique_v3
 on public.messages (id, conversation_id);
alter table public.messages
 add column if not exists reply_to_id uuid;
alter table public.messages
 add constraint messages_reply_same_conversation_v3
 foreign key (reply_to_id,conversation_id)
 references public.messages(id,conversation_id)
 on delete restrict;
create index if not exists messages_reply_to_id_v3_idx
 on public.messages(reply_to_id) where reply_to_id is not null;

-- One private reaction per member per message. Direct and Group message IDs
-- are two independent namespaces with explicit cascading cleanup.
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

commit;

-- REQUIRED MANUAL VERIFICATION ON STAGING BEFORE ENABLEMENT:
-- * anon cannot select/insert/delete any reactions.
-- * member of A cannot see or react to messages in B.
-- * cannot fabricate a reaction on a nonexistent or inactive message.
-- * blocked/left members cannot send new messages/reactions.
-- * cannot create a direct reply referencing another conversation.
-- * wrong user_id on reaction insert is denied.
-- * distinct members can each react once, change via delete/insert,
--   and delete only their own reaction.
-- * ensure the direct-message UPDATE policy cannot move message ownership
--   or conversation_id; tighten it as needed before allowing client updates.
-- * verify direct-message editing can still update body and trigger-edited_at,
-- * validate rate limiting, moderation, backup/restore, execution plan,
--   API exposure and all Supabase security advisors before migration.
