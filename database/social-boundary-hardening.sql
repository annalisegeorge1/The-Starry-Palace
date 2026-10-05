-- The Starry Palace — social boundary + RPC hardening
-- Production database verified on 2026-10-05.

create or replace function private.enforce_member_exile_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.blocked is true and coalesce(old.blocked,false) is distinct from true then
    delete from public.member_follows
    where (follower_id=new.user_id and followed_id=new.other_user_id)
       or (follower_id=new.other_user_id and followed_id=new.user_id);

    delete from public.message_requests
    where status='pending'
      and (
        (sender_id=new.user_id and recipient_id=new.other_user_id)
        or (sender_id=new.other_user_id and recipient_id=new.user_id)
      );
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_member_exile_cleanup() from public;
revoke all on function private.enforce_member_exile_cleanup() from anon;
revoke all on function private.enforce_member_exile_cleanup() from authenticated;

drop trigger if exists trg_member_exile_cleanup on public.user_member_boundaries;
create trigger trg_member_exile_cleanup
after insert or update of blocked on public.user_member_boundaries
for each row
execute function private.enforce_member_exile_cleanup();

-- These SECURITY DEFINER RPCs are signed-in member operations.
-- Remove the implicit anonymous/public EXECUTE grant while preserving authenticated access.
revoke execute on function public.ascend_palace_gift(uuid,text) from public, anon;
grant execute on function public.ascend_palace_gift(uuid,text) to authenticated;

revoke execute on function public.create_gift_trade_offer(uuid,uuid,text,uuid,text,text) from public, anon;
grant execute on function public.create_gift_trade_offer(uuid,uuid,text,uuid,text,text) to authenticated;

revoke execute on function public.remove_profile_achievement_showcase(uuid) from public, anon;
grant execute on function public.remove_profile_achievement_showcase(uuid) to authenticated;

revoke execute on function public.remove_profile_gift_showcase(uuid) from public, anon;
grant execute on function public.remove_profile_gift_showcase(uuid) to authenticated;

revoke execute on function public.reorder_comic_episodes(uuid,uuid[]) from public, anon;
grant execute on function public.reorder_comic_episodes(uuid,uuid[]) to authenticated;

revoke execute on function public.reorder_comic_pages(uuid,uuid[]) from public, anon;
grant execute on function public.reorder_comic_pages(uuid,uuid[]) to authenticated;

revoke execute on function public.reorder_series_works(uuid,uuid[]) from public, anon;
grant execute on function public.reorder_series_works(uuid,uuid[]) to authenticated;

revoke execute on function public.respond_gift_trade_offer(uuid,text) from public, anon;
grant execute on function public.respond_gift_trade_offer(uuid,text) to authenticated;

revoke execute on function public.set_profile_achievement_showcase(uuid,text,integer) from public, anon;
grant execute on function public.set_profile_achievement_showcase(uuid,text,integer) to authenticated;

revoke execute on function public.set_profile_gift_showcase(uuid,text,integer) from public, anon;
grant execute on function public.set_profile_gift_showcase(uuid,text,integer) to authenticated;
