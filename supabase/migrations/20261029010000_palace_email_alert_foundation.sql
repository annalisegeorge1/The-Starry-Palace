-- THE STARRY PALACE · email alerts foundation (NOT activated by this migration)
-- Review and test in an isolated Supabase project before applying to production.
-- This migration never opts existing accounts into outbound mail.
alter table public.notification_preferences
  add column if not exists email_alerts_enabled boolean not null default false,
  add column if not exists email_frequency text not null default 'daily',
  add column if not exists email_topics text[] not null
    default array['story','comic','comments','message','invitation','event']::text[];

alter table public.notification_preferences
  add constraint palace_email_frequency_check
    check(email_frequency in ('immediate','daily','weekly')),
  add constraint palace_email_topics_check
    check(email_topics <@ array['story','comic','comments','message','invitation','clubs','event','treasury','council']::text[]);
-- Existing email_digest is an old recorded preference, NOT consent for this system.

create table if not exists private.palace_email_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);
create table if not exists private.palace_email_jobs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_type text not null,
  status text not null default 'pending'
    check (status in ('pending','claimed','sent','failed')),
  attempts integer not null default 0 check (attempts between 0 and 6),
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists palace_email_jobs_ready_idx
  on private.palace_email_jobs (status,next_attempt_at,created_at);
create index if not exists palace_email_jobs_user_idx
  on private.palace_email_jobs (user_id,status,created_at);
revoke all on private.palace_email_tokens, private.palace_email_jobs from public,anon,authenticated;

create or replace function private.enqueue_palace_email_notice()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare v_topics text[];
begin
  if TG_OP='UPDATE' and new.created_at is not distinct from old.created_at then return new; end if;
  if new.notice_type not in ('story','comic','comments','message','invitation','clubs','event','treasury','council') then return new; end if;
  select email_topics into v_topics from public.notification_preferences
   where user_id=new.user_id and email_alerts_enabled=true;
  if v_topics is null or not new.notice_type=any(v_topics) then return new; end if;
  insert into private.palace_email_jobs (notification_id,user_id,notice_type)
   values(new.id,new.user_id,new.notice_type)
   on conflict(notification_id) do nothing;
  return new;
end
$fn$;
drop trigger if exists palace_email_notice_queued on public.notifications;
create trigger palace_email_notice_queued after insert or update of created_at on public.notifications
for each row execute function private.enqueue_palace_email_notice();
revoke all on function private.enqueue_palace_email_notice() from public,anon,authenticated;

-- Service-only RPC. For each member, reserve at most 50 due events.
-- Claimed work has a 20-minute lease to survive crashed send workers.
create or replace function public.palace_email_claim_batches(p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_user record;v_claim uuid;v_rows jsonb;v_result jsonb:='[]'::jsonb;v_token uuid;
begin
  for v_user in
    select q.user_id,u.email,p.email_frequency
    from private.palace_email_jobs q
    join public.notification_preferences p on p.user_id=q.user_id
    join auth.users u on u.id=q.user_id
    where p.email_alerts_enabled=true and u.email is not null and u.email_confirmed_at is not null
     and q.notice_type=any(p.email_topics)
     and q.attempts<5
     and ((q.status='pending' and q.next_attempt_at<=now())
       or (q.status='claimed' and q.claimed_at<now()-interval '20 minutes'))
     and (p.email_frequency='immediate'
       or (p.email_frequency='daily' and q.created_at < date_trunc('day',now() at time zone 'utc') at time zone 'utc')
       or (p.email_frequency='weekly' and q.created_at < date_trunc('week',now() at time zone 'utc') at time zone 'utc'))
    group by q.user_id,u.email,p.email_frequency
    order by min(q.created_at)
    limit greatest(1,least(coalesce(p_limit,10),20))
  loop
    v_claim:=gen_random_uuid();
    with due as (
      select q.id from private.palace_email_jobs q
      where q.user_id=v_user.user_id
       and q.attempts<5
       and ((q.status='pending' and q.next_attempt_at<=now())
          or (q.status='claimed' and q.claimed_at<now()-interval '20 minutes'))
       and (v_user.email_frequency='immediate'
        or (v_user.email_frequency='daily' and q.created_at < date_trunc('day',now() at time zone 'utc') at time zone 'utc')
        or (v_user.email_frequency='weekly' and q.created_at < date_trunc('week',now() at time zone 'utc') at time zone 'utc'))
       and exists (select 1 from public.notification_preferences p
         where p.user_id=q.user_id and p.email_alerts_enabled=true and q.notice_type=any(p.email_topics))
      order by q.created_at limit 50 for update skip locked
    ), reserved as (
      update private.palace_email_jobs q
       set status='claimed',claimed_at=now(),claim_token=v_claim,attempts=q.attempts+1
       from due where q.id=due.id
       returning q.id,q.notice_type
    )
    select jsonb_agg(jsonb_build_object('id',id,'type',notice_type))
      into v_rows from reserved;
    if v_rows is null then continue; end if;
    insert into private.palace_email_tokens(user_id) values(v_user.user_id)
      on conflict(user_id) do nothing;
    select unsubscribe_token into v_token from private.palace_email_tokens
      where user_id=v_user.user_id;
    v_result:=v_result || jsonb_build_array(jsonb_build_object(
      'claim_token',v_claim,'email',v_user.email,'frequency',v_user.email_frequency,
      'items',v_rows,'unsubscribe_token',v_token));
  end loop;
  return v_result;
end
$fn$;
revoke all on function public.palace_email_claim_batches(integer) from public,anon,authenticated;
grant execute on function public.palace_email_claim_batches(integer) to service_role;

create or replace function public.palace_email_finish_batch(
 p_claim_token uuid,p_success boolean,p_provider_message_id text default null
) returns integer language plpgsql security definer set search_path=''
as $fn$
declare v_count integer;
begin
  with changes as (
    update private.palace_email_jobs q
      set status=case when p_success then 'sent' when attempts>=5 then 'failed' else 'pending' end,
          delivered_at=case when p_success then now() else null end,
          provider_message_id=case when p_success then left(coalesce(p_provider_message_id,''),200) else null end,
          last_error=case when p_success then null else 'Delivery provider rejected or timed out' end,
          next_attempt_at=case when p_success then now()
            else now()+ (power(2,least(attempts,5))::integer * interval '5 minutes') end,
          claim_token=null,claimed_at=null
      where q.claim_token=p_claim_token and q.status='claimed'
      returning id
  ) select count(*) into v_count from changes;
  return v_count;
end
$fn$;
revoke all on function public.palace_email_finish_batch(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.palace_email_finish_batch(uuid,boolean,text) to service_role;

-- Unsubscribe tokens confer permission only to DISABLE emails; never read data.
create or replace function public.palace_email_unsubscribe(p_token uuid)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare v_id uuid;
begin
  select user_id into v_id from private.palace_email_tokens where unsubscribe_token=p_token;
  if v_id is null then return false; end if;
  update public.notification_preferences
   set email_alerts_enabled=false,email_digest=false,updated_at=now()
   where user_id=v_id;
  return true;
end
$fn$;
revoke all on function public.palace_email_unsubscribe(uuid) from public;
grant execute on function public.palace_email_unsubscribe(uuid) to anon,authenticated;

comment on function public.palace_email_claim_batches(integer) is
'Service-role-only queue claims. No credentials or message content stored in job table.';
