-- THE STARRY PALACE — PROPOSED SECURITY FIX, NOT A PRODUCTION MIGRATION.
-- Guard a collaboration invitation's *fields*, not merely its row owner.
-- Current production UPDATE RLS permits invited users to update any field
-- of their own invitation (including role, work_id and invited_by). Without
-- a trigger, a recipient could self-promote from editor to co_writer.
-- This guard keeps the existing legitimate client API unchanged.
-- Must be applied in an isolated Supabase staging project first.

create or replace function private.guard_work_collaboration_write()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  -- Preserve privileged administrative maintenance and recovery operations:
  -- these two Supabase database roles already BYPASSRLS by design. Never
  -- grant either role, or its credentials, to a browser or normal member.
  if current_user in ('postgres','service_role') then
    return new;
  end if;

  if v_actor is null then
    raise exception 'Sign in to manage a writing collaboration.';
  end if;

  if tg_op = 'INSERT' then
    if not private.is_work_owner(new.work_id)
       or new.invited_by is distinct from v_actor
       or new.user_id = v_actor
       or new.status <> 'invited'
       or new.responded_at is not null
    then
      raise exception 'Only the work owner can send a new collaboration invitation.';
    end if;
    return new;
  end if;

  -- No one may redirect an existing invitation to a different work or member.
  if old.work_id is distinct from new.work_id
     or old.user_id is distinct from new.user_id
     or old.created_at is distinct from new.created_at
  then
    raise exception 'The collaboration identity cannot be changed.';
  end if;

  if private.is_work_owner(old.work_id) then
    -- Owners can re-invite, change their collaborator's role, and remove using
    -- the existing DELETE policy. Do not let them impersonate an inviter.
    if new.invited_by is distinct from old.invited_by then
      raise exception 'The collaboration inviter cannot be changed.';
    end if;
    -- The author cannot accept or decline *for* a collaborator.
    if (new.status in ('accepted','declined') and new.status is distinct from old.status)
       or (new.role is distinct from old.role and new.status <> 'invited')
    then
      raise exception 'A changed collaboration role requires a fresh invitation and acceptance.';
    end if;
    if new.status = 'invited' then
      new.responded_at := null;
    end if;
    return new;
  end if;

  if v_actor = old.user_id then
    -- Invitees can only accept/decline *pending* invitations.
    -- They cannot change their role or membership scope in the same request.
    if old.status <> 'invited'
       or new.status not in ('accepted','declined')
       or new.role is distinct from old.role
       or new.invited_by is distinct from old.invited_by
    then
      raise exception 'Only the invited member may accept or decline their existing invitation.';
    end if;
    new.responded_at := now();
    new.updated_at := now();
    return new;
  end if;

  raise exception 'Not authorised to change this collaboration.';
end;
$function$;

drop trigger if exists guard_work_collaboration_write on public.work_collaborators;
create trigger guard_work_collaboration_write
before insert or update on public.work_collaborators
for each row execute function private.guard_work_collaboration_write();

-- Restore production DB function/trigger baseline if rollback is required;
-- document the original state before rollout. DO NOT apply to live database.
