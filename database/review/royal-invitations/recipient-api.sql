-- Install only after foundation.sql and explicit production approval.
begin;
alter table royal_invitation.policy add column recipient_claims boolean not null default false;

create table royal_invitation.claim_attempts(
 member_id uuid primary key references auth.users(id),
 window_start timestamptz not null,
 attempts integer not null check (attempts between 1 and 10)
);
revoke all on royal_invitation.claim_attempts from public,anon,authenticated,service_role;
create function public.royal_invitation_claim(p_token text) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
 if actor is null or not (select recipient_claims from royal_invitation.policy)
  or not royal_invitation.eligible(actor) then raise exception 'Invitation unavailable'; end if;
 insert into royal_invitation.claim_attempts as previous values(actor,now(),1)
 on conflict(member_id) do update set
 attempts=case when previous.window_start<=now()-interval '10 minutes' then 1 else previous.attempts+1 end,
 window_start=case when previous.window_start<=now()-interval '10 minutes' then now() else previous.window_start end
 where previous.attempts<10 or previous.window_start<=now()-interval '10 minutes';
 if not found or p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 begin
  perform royal_invitation.redeem(actor,pg_catalog.decode(p_token,'hex'));
 exception when unique_violation or raise_exception then return null;
 end;
 return royal_invitation.member_summary(actor)->'keepsake';
end $$;
create function public.royal_invitation_welcome_gift(p_choice text) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
 if actor is null or not (select recipient_claims from royal_invitation.policy)
  or not royal_invitation.choose_gift(actor,p_choice) then raise exception 'Gift unavailable'; end if;
 return royal_invitation.member_summary(actor)->'keepsake';
end $$;
create function public.royal_invitation_my_record() returns jsonb
 language sql stable security definer set search_path='' as $$
 select case when auth.uid() is not null and royal_invitation.eligible(auth.uid())
 then royal_invitation.member_summary(auth.uid()) else null end
$$;
revoke all on function public.royal_invitation_claim(text),public.royal_invitation_welcome_gift(text),
 public.royal_invitation_my_record() from public,anon,authenticated,service_role;
grant execute on function public.royal_invitation_claim(text),public.royal_invitation_welcome_gift(text),
 public.royal_invitation_my_record() to authenticated;
create function public.royal_invitation_manage_envoy(p_member uuid,p_action text) returns void
 language plpgsql security definer set search_path='' as $$
begin
 case p_action
 when 'approve' then perform royal_invitation.manage_envoy(auth.uid(),p_member,true);
 when 'suspend' then perform royal_invitation.manage_envoy(auth.uid(),p_member,false);
 when 'allocate' then perform royal_invitation.allocate_quarter(auth.uid(),p_member);
 else raise exception 'Invalid action'; end case;
end $$;
create function public.royal_invitation_revoke(p_letter uuid) returns boolean
 language sql security definer set search_path='' as $$
 select royal_invitation.revoke_letter(auth.uid(),p_letter)
$$;
revoke all on function public.royal_invitation_manage_envoy(uuid,text),public.royal_invitation_revoke(uuid)
 from public,anon,authenticated,service_role;
grant execute on function public.royal_invitation_manage_envoy(uuid,text),public.royal_invitation_revoke(uuid) to authenticated;
-- A signed adjustment is limited to one physical seal and a desk-authored reason.
alter table royal_invitation.events add column adjustment_id uuid unique, add column reason text;
create function public.royal_invitation_adjust(p_member uuid,p_request uuid,p_remove boolean,p_reason text)
 returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous royal_invitation.events; seal uuid; action_name text;
begin
 if not royal_invitation.eligible(actor) or not exists(select 1 from royal_invitation.issuers where member_id=actor and kind='desk' and enabled)
 then raise exception 'Desk approval required'; end if;
 if p_request is null or p_remove is null or length(trim(coalesce(p_reason,''))) not between 3 and 160 then raise exception 'Invalid adjustment'; end if;
 perform 1 from royal_invitation.issuers where member_id=p_member and kind='envoy' and enabled for update;
 if not found then raise exception 'Invalid nominee'; end if;
 action_name:=case when p_remove then 'adjustment_removed' else 'adjustment_granted' end;
 select * into previous from royal_invitation.events where adjustment_id=p_request;
 if found then
  if previous.actor_id=actor and previous.subject_id=p_member and previous.reason=p_reason and previous.event=action_name then return; end if;
  raise exception 'Adjustment unavailable';
 end if;
 if p_remove then
  select s.id into seal from royal_invitation.seals s where owner_id=p_member and expires_at>now()
   and not exists(select 1 from royal_invitation.letters l where l.seal_id=s.id and (l.state='redeemed' or (l.state='pending' and l.expires_at>now())))
   order by expires_at,id limit 1;
  if seal is null then raise exception 'No available seal'; end if;
  update royal_invitation.seals set expires_at=now() where id=seal;
 else
  insert into royal_invitation.seals(owner_id,allocation_key,expires_at) values(p_member,'desk-'||p_request::text,
   (date_trunc('quarter',now() at time zone 'UTC') + interval '3 months') at time zone 'UTC') returning id into seal;
 end if;
 insert into royal_invitation.events(actor_id,subject_id,seal_id,event,reason,adjustment_id)
 values(actor,p_member,seal,action_name,p_reason,p_request);
end $$;
revoke all on function public.royal_invitation_adjust(uuid,uuid,boolean,text) from public,anon,authenticated,service_role;
grant execute on function public.royal_invitation_adjust(uuid,uuid,boolean,text) to authenticated;
commit;
