-- Operational rollback. Existing distinctions, inventory and audit events remain.
begin;
update royal_invitation.policy set member_sending=false,recipient_claims=false;
revoke execute on function public.royal_invitation_prepare_dispatch(uuid,uuid,text,text,text,text,text,text)
 from service_role;
revoke execute on function public.royal_invitation_manage_envoy(uuid,text),public.royal_invitation_adjust(uuid,uuid,boolean,text) from authenticated;
commit;
