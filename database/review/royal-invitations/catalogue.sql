-- Review only. Generate identities in the destination catalogue. Final art approval is separate.
begin;
lock table public.virtual_gifts in share row exclusive mode;
with items(benefit,name,description) as (values
 ('royal','Royal Seal','Admission distinction for an accepted Royal Invitation.'),
 ('honoured','Honoured Guest Seal','Admission distinction for an accepted Honoured Guest Invitation.'),
 ('founding','Founding Guest Seal','Admission distinction for an accepted Founding Invitation.'),
 ('starforged-circlet','Starforged Circlet','White-gold celestial portrait frame.'),
 ('moonlit-heirloom','Moonlit Heirloom','Silver and lilac moonlit portrait frame.'),
 ('rose-of-the-court','Rose of the Court','Rose-gold floral portrait frame.'),
 ('royal-midnight','Royal Midnight','Midnight blue and gold Chamber palette.'),
 ('celestial-dawn','Celestial Dawn','Lilac and rose Chamber palette.')
), created as (
 insert into public.virtual_gifts(gift_key,catalogue_number,name,description,court_name,collection_type,catalogue_status,art_status,reward_eligible,upgrade_copies)
 select 'royal-invitation:'||benefit,(select coalesce(max(catalogue_number),0) from public.virtual_gifts)+row_number() over(order by benefit),
 name,description,'Royal Post','Royal Invitations','catalogued','reference-ready',false,3 from items returning gift_key,id
)
insert into royal_invitation.cosmetics(benefit,gift_id)
select substr(gift_key,length('royal-invitation:')+1),id from created;
commit;
