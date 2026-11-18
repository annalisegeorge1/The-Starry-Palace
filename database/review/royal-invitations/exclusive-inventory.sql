begin;
create function royal_invitation.check_inventory() returns trigger
language plpgsql security definer set search_path='' as $$
declare benefit_key text;
begin
 if tg_op='DELETE' then
  if exists(select 1 from royal_invitation.cosmetics where gift_id=old.gift_id)
  and exists(select 1 from auth.users where id=old.user_id) then raise exception 'Invitation keepsakes are personal'; end if;
  return old;
 end if;
 if tg_op='UPDATE' and exists(select 1 from royal_invitation.cosmetics where gift_id=old.gift_id)
 and (new.user_id,new.gift_id,new.copies,new.tier) is distinct from (old.user_id,old.gift_id,old.copies,old.tier)
 then raise exception 'Invitation keepsakes are personal'; end if;
 select benefit into benefit_key from royal_invitation.cosmetics where gift_id=new.gift_id;
 if found and (new.copies<>1 or new.tier<>'bronze' or not exists(select 1 from royal_invitation.letters
 where accepted_by=new.user_id and state='redeemed' and benefit_key in (class,welcome_gift)))
 then raise exception 'Invitation keepsakes are personal'; end if;
 return new;
end $$;
revoke all on function royal_invitation.check_inventory() from public,anon,authenticated,service_role;
create trigger check_invitation_inventory before insert or update or delete on public.user_gift_inventory
 for each row execute function royal_invitation.check_inventory();
commit;
