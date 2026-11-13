-- Requires the original private Palace delivery ledger and recipient-api.sql.
begin;
alter table royal_invitation.letters add column delivery_id uuid unique references private.palace_invitation_delivery_log(id),
 add column last_attempt timestamptz, add column dispatch_recipient text;
create unique index royal_one_pending_recipient on royal_invitation.letters(issuer_id,dispatch_recipient)
 where state='pending';
create function public.royal_invitation_prepare_dispatch(p_actor uuid,p_request uuid,p_class text,p_recipient text,p_token text,p_fingerprint text,p_greeting text default '',p_message text default '')
 returns text language plpgsql security definer set search_path='' as $$
declare letter royal_invitation.letters; log_entry private.palace_invitation_delivery_log;
begin
 if not (select recipient_claims from royal_invitation.policy) or p_token is null or p_token !~ '^[0-9a-f]{64}$'
 then raise exception 'Dispatch unavailable'; end if;
 perform royal_invitation.issue(p_actor,p_request,p_class,p_recipient,pg_catalog.decode(p_token,'hex'));
 select * into strict letter from royal_invitation.letters where id=p_request for update;
 if p_greeting is null or length(p_greeting)>60 or p_message is null or length(p_message)>300
  then raise exception 'Invalid personal letter'; end if;
 if letter.delivery_id is null then
  update royal_invitation.letters set delivery_id=public.palace_invitation_reserve(p_actor,p_fingerprint),
   last_attempt=now(),dispatch_recipient=p_fingerprint,greeting=p_greeting,personal_message=p_message where id=p_request;
 else
  select * into strict log_entry from private.palace_invitation_delivery_log where id=letter.delivery_id;
  if log_entry.recipient_fingerprint is distinct from p_fingerprint or letter.greeting<>p_greeting or letter.personal_message<>p_message then raise exception 'Dispatch unavailable'; end if;
  if log_entry.status='accepted' then return 'provider_accepted'; end if;
  -- Keep retries inside the provider idempotency window. Uncertain sends outside
  -- the window require desk reconciliation, never an automatic new dispatch.
  if now()-letter.issued_at>=interval '23 hours' or now()-letter.last_attempt<interval '60 seconds'
   then raise exception 'Dispatch unavailable'; end if;
  update private.palace_invitation_delivery_log set status='reserved',completed_at=null
   where id=letter.delivery_id and status='failed';
  update royal_invitation.letters set last_attempt=now() where id=p_request;
 end if;
 return 'send';
end $$;
create function public.royal_invitation_finish_dispatch(p_request uuid,p_accepted boolean,p_provider_id text)
 returns boolean language plpgsql security definer set search_path='' as $$
declare delivery uuid;
begin
 select delivery_id into delivery from royal_invitation.letters where id=p_request for update;
 if delivery is null then return false; end if;
 return public.palace_invitation_finish(delivery,p_accepted,p_provider_id);
end $$;
revoke all on function public.royal_invitation_prepare_dispatch(uuid,uuid,text,text,text,text,text,text),
 public.royal_invitation_finish_dispatch(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.royal_invitation_prepare_dispatch(uuid,uuid,text,text,text,text,text,text),
 public.royal_invitation_finish_dispatch(uuid,boolean,text) to service_role;
commit;
