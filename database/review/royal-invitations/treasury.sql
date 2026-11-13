-- Review separately. An empty mapping intentionally prevents issuing honours.
-- Bind each key only to an approved, finished, invitation-exclusive gift.
begin;
create table royal_invitation.cosmetics(
 benefit text primary key check(benefit in ('royal','honoured','founding','starforged-circlet','moonlit-heirloom','rose-of-the-court','royal-midnight','celestial-dawn')),
 gift_id uuid unique not null references public.virtual_gifts(id)
);
revoke all on royal_invitation.cosmetics from public,anon,authenticated,service_role;
create function royal_invitation.award_cosmetic() returns trigger
 language plpgsql set search_path='' as $$
declare benefit_key text; award_key text; approved uuid;
begin
 if old.accepted_by is null and new.accepted_by is not null then
  benefit_key:=new.class; award_key:='admission-seal';
 elsif old.welcome_gift is null and new.welcome_gift is not null then
  benefit_key:=new.welcome_gift; award_key:='welcome-chest';
 else return new; end if;
 select g.id into approved from royal_invitation.cosmetics c join public.virtual_gifts g on g.id=c.gift_id
 where c.benefit=benefit_key and g.art_status='final' and g.reward_eligible=false;
 if not found then raise exception 'Invitation benefit unavailable'; end if;
 insert into public.gift_grant_ledger(user_id,gift_id,tier,quantity,source_type,source_key,note)
 values(new.accepted_by,approved,'bronze',1,'system','royal-invitation:'||award_key,'Royal Invitation keepsake');
 return new;
end $$;
revoke execute on function royal_invitation.award_cosmetic() from public,anon,authenticated,service_role;
create trigger royal_invitation_treasury after update of accepted_by,welcome_gift on royal_invitation.letters
 for each row execute function royal_invitation.award_cosmetic();
commit;
