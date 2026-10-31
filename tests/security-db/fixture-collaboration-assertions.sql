-- EPHEMERAL CI ONLY: prove a collaborator cannot escalate an invitation.
-- Uses real PostgreSQL RLS, triggers and roles; synthetic auth.uid() identity.
-- Never execute against the production Supabase project.

-- Author sends invitation to a synthetic 13-year-old, as "editor".
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
insert into public.work_collaborators
 (work_id,user_id,role,status,invited_by)
values
 ('10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'editor','invited','00000000-0000-0000-0000-000000000001');

-- Author cannot silently assign accepted status without invitation acceptance.
do $test$
declare denied boolean := false;
begin
 begin
   insert into public.work_collaborators
    (work_id,user_id,role,status,invited_by)
   values (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'editor','accepted','00000000-0000-0000-0000-000000000001'
   );
 exception when others then denied := true; end;
 if not denied then raise exception 'Owner bypassed invitation acceptance';end if;
end $test$;
reset role;

-- Invitee can see own invitation but cannot promote themselves.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $test$
declare denied boolean; n integer;
begin
 select count(*) into n from public.work_collaborators
 where work_id='10000000-0000-0000-0000-000000000001'
 and user_id='00000000-0000-0000-0000-000000000003'
 and role='editor' and status='invited';
 if n<>1 then raise exception 'Invited member cannot view invitation';end if;

 denied:=false;
 begin
   update public.work_collaborators set role='co_writer'
   where work_id='10000000-0000-0000-0000-000000000001'
     and user_id='00000000-0000-0000-0000-000000000003';
 exception when others then denied:=true;end;
 if not denied then raise exception 'Invitee could self-promote to co_writer';end if;

 denied:=false;
 begin
   update public.work_collaborators
   set work_id='10000000-0000-0000-0000-000000000004'
   where work_id='10000000-0000-0000-0000-000000000001'
     and user_id='00000000-0000-0000-0000-000000000003';
 exception when others then denied:=true;end;
 if not denied then raise exception 'Invitee redirected invitation to an adult work';end if;

 denied:=false;
 begin
   update public.work_collaborators
   set invited_by='00000000-0000-0000-0000-000000000002'
   where work_id='10000000-0000-0000-0000-000000000001'
     and user_id='00000000-0000-0000-0000-000000000003';
 exception when others then denied:=true;end;
 if not denied then raise exception 'Invitee altered inviter identity';end if;

 update public.work_collaborators set status='accepted',responded_at=now(),updated_at=now()
 where work_id='10000000-0000-0000-0000-000000000001'
 and user_id='00000000-0000-0000-0000-000000000003';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Invitee could not accept legitimate invitation';end if;

 denied:=false;
 begin
   update public.work_collaborators set status='declined'
   where work_id='10000000-0000-0000-0000-000000000001'
     and user_id='00000000-0000-0000-0000-000000000003';
 exception when others then denied:=true;end;
 if not denied then raise exception 'Invitee changed resolved invitation again';end if;
end $test$;
reset role;

-- Author retains the ability to change assigned role and re-invite.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $test$
declare n integer;
begin
 -- The invitee already accepted above; owner first re-invites, resetting
 -- consent to pending, before testing forbidden owner-side acceptance.
 update public.work_collaborators
 set status='invited',responded_at=null,updated_at=now()
 where work_id='10000000-0000-0000-0000-000000000001'
   and user_id='00000000-0000-0000-0000-000000000003';

 -- Even the owner must not approve an invitation on behalf of another user.
 declare
  denied boolean := false;
 begin
  begin
   update public.work_collaborators set status='accepted'
   where work_id='10000000-0000-0000-0000-000000000001'
    and user_id='00000000-0000-0000-0000-000000000003';
  exception when others then denied := true; end;
  if not denied then raise exception 'Owner accepted without recipient consent';end if;
 end;

 update public.work_collaborators
 set role='co_writer',status='invited',responded_at=null,updated_at=now()
 where work_id='10000000-0000-0000-0000-000000000001'
   and user_id='00000000-0000-0000-0000-000000000003';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Owner could not re-invite/change assigned role';end if;
 select count(*) into n from public.work_collaborators
 where work_id='10000000-0000-0000-0000-000000000001'
   and user_id='00000000-0000-0000-0000-000000000003'
   and role='co_writer' and status='invited';
 if n<>1 then raise exception 'Owner role update did not persist';end if;
end $test$;
reset role;
select set_config('request.jwt.claim.sub','',false);
select 'PASS: synthetic collaboration invitation escalation prevented' as result;
