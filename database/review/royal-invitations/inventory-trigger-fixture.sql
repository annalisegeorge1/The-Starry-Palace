-- Schema-only reproduction of the production inventory trigger for isolated QA.
CREATE OR REPLACE FUNCTION private.apply_gift_grant()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into public.user_gift_inventory(user_id,gift_id,tier,copies)
  values(new.user_id,new.gift_id,new.tier,new.quantity)
  on conflict(user_id,gift_id,tier)
  do update set copies=public.user_gift_inventory.copies+excluded.copies,updated_at=now();
  return new;
end;
$function$;
create trigger apply_gift_grant after insert on public.gift_grant_ledger for each row execute function private.apply_gift_grant();
