-- REVIEW ONLY: initial Royal Invitation Desk holder.
-- Owner approved the DESIGNATED IDENTITY on 2026-11-13.
-- DO NOT RUN against production without a separate, explicit approval of
-- the reviewed schema installation and initial privilege grant.
-- Requires foundation.sql and recipient-api.sql already installed and reviewed.
-- Never embed this file in automatic migrations or startup jobs.
begin;
do $bootstrap$
declare
  approved_id constant uuid := '50c3246a-db88-4bdd-a355-4e6562ebf744';
  current_kind text;
begin
  if to_regclass('royal_invitation.issuers') is null
     or to_regclass('royal_invitation.policy') is null
     or to_regprocedure('royal_invitation.eligible(uuid)') is null
  then
    raise exception 'Royal Invitation foundations are not installed';
  end if;
  if not exists (
    select 1 from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = approved_id
      and lower(p.username) = 'thebluemoonjune'
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Approved owner identity or email verification does not match';
  end if;
  if not royal_invitation.eligible(approved_id) then
    raise exception 'Approved owner is not currently eligible';
  end if;
  if not exists (
    select 1 from royal_invitation.policy
    where member_sending = false
      and recipient_claims = false
  ) then
    raise exception 'Royal Invitation activation gates must remain disabled';
  end if;
  select kind into current_kind from royal_invitation.issuers
    where member_id = approved_id for update;
  if current_kind is not null and current_kind <> 'desk' then
    raise exception 'Existing issuer has an incompatible privilege kind';
  end if;
  insert into royal_invitation.issuers(member_id,kind,enabled)
    values(approved_id,'desk',true)
    on conflict(member_id) do nothing;
  if not exists (
    select 1 from royal_invitation.issuers
    where member_id = approved_id and kind = 'desk' and enabled
  ) then
    raise exception 'The designated desk holder was not enabled';
  end if;
end
$bootstrap$;
-- During approved execution, inspect transaction results and record the
-- operator, UTC time and approval reference in the private release log.
-- No member issuing, claiming, reward awards or emails are enabled by this SQL.
commit;
