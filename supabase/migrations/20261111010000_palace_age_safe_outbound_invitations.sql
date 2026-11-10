-- Palace invitations, sent BEFORE account creation. Does not modify auth.users,
-- minimum-age triggers, existing sign-in, or member email notification settings.
-- Recipient address is never persisted: only a keyed HMAC fingerprint is stored.
create schema if not exists private;

create table if not exists private.palace_invitation_delivery_log (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_fingerprint text not null check (recipient_fingerprint ~ '^[0-9a-f]{64}$'),
 requested_at timestamptz not null default now(),
 status text not null default 'reserved' check (status in ('reserved','accepted','failed')),
 provider_message_id text,
 completed_at timestamptz
);

create index if not exists palace_invitation_delivery_sender_idx
 on private.palace_invitation_delivery_log(sender_id,requested_at desc);
create index if not exists palace_invitation_delivery_recipient_idx
 on private.palace_invitation_delivery_log(recipient_fingerprint,requested_at desc);

alter table private.palace_invitation_delivery_log enable row level security;
revoke all on private.palace_invitation_delivery_log from public,anon,authenticated;

-- Called only from a server-side Edge Function after verifying an authentic
-- user JWT and a server-configured administrator allowlist. Its service-role
-- reservation lock makes quotas atomic across Edge Function instances.
create or replace function public.palace_invitation_reserve(
 p_sender_id uuid,p_recipient_fingerprint text
) returns uuid
language plpgsql security definer
set search_path=''
as $fn$
declare v_invitation_id uuid;
begin
 if p_sender_id is null or p_recipient_fingerprint is null or
    p_recipient_fingerprint !~ '^[0-9a-f]{64}$' then
   raise exception 'invalid_invitation_request';
 end if;
 if not exists(select 1 from auth.users u
               where u.id=p_sender_id and u.email_confirmed_at is not null) then
   raise exception 'invitation_sender_ineligible';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_sender_id::text));
 if (select count(*) from private.palace_invitation_delivery_log
     where sender_id=p_sender_id and requested_at>now()-interval '24 hours')>=20 or
    (select count(*) from private.palace_invitation_delivery_log
     where sender_id=p_sender_id and requested_at>now()-interval '10 minutes')>=5 or
    (select count(*) from private.palace_invitation_delivery_log
     where sender_id=p_sender_id and recipient_fingerprint=p_recipient_fingerprint
       and requested_at>now()-interval '24 hours')>=2 then
   raise exception 'invitation_rate_limited';
 end if;
 insert into private.palace_invitation_delivery_log(sender_id,recipient_fingerprint)
 values(p_sender_id,p_recipient_fingerprint) returning id into v_invitation_id;
 return v_invitation_id;
end
$fn$;
revoke all on function public.palace_invitation_reserve(uuid,text) from public,anon,authenticated;
grant execute on function public.palace_invitation_reserve(uuid,text) to service_role;

create or replace function public.palace_invitation_finish(
 p_id uuid,p_accepted boolean,p_provider_message_id text default null
) returns boolean
language plpgsql security definer
set search_path=''
as $fn$
begin
 update private.palace_invitation_delivery_log
 set status=case when p_accepted then 'accepted' else 'failed' end,
     provider_message_id=case when p_accepted then left(coalesce(p_provider_message_id,''),200) else null end,
     completed_at=now()
 where id=p_id and status='reserved';
 return found;
end
$fn$;
revoke all on function public.palace_invitation_finish(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.palace_invitation_finish(uuid,boolean,text) to service_role;
