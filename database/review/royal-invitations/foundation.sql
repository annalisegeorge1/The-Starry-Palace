-- Review candidate. Install as a dedicated migration owner under change control.
-- No application role may call these private operations in this phase.
begin;
create schema royal_invitation;
revoke all on schema royal_invitation from public, anon, authenticated, service_role;
create table royal_invitation.policy (
 singleton boolean primary key default true check (singleton),
 quarterly_seals integer not null default 2 check (quarterly_seals between 0 and 20),
 member_sending boolean not null default false,
 lifetime_days integer not null default 14 check (lifetime_days between 1 and 90),
 founding_window tstzrange check (founding_window is null or
   (not isempty(founding_window) and not lower_inf(founding_window) and not upper_inf(founding_window)))
);
insert into royal_invitation.policy default values;
create table royal_invitation.issuers (
 member_id uuid primary key references auth.users(id),
 kind text not null check (kind in ('envoy','desk')),
 enabled boolean not null default true
);
create table royal_invitation.seals (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references royal_invitation.issuers(member_id),
 allocation_key text not null check (length(allocation_key) between 1 and 100),
 expires_at timestamptz not null,
 unique(owner_id,allocation_key), unique(owner_id,id)
);
create table royal_invitation.letters (
 id uuid primary key,
 issuer_id uuid not null references royal_invitation.issuers(member_id),
 class text not null check (class in ('royal','honoured','founding')),
 seal_id uuid,
 foreign key(issuer_id,seal_id) references royal_invitation.seals(owner_id,id),
 token_hash bytea unique not null check(octet_length(token_hash)=32),
 recipient_binding bytea not null check(octet_length(recipient_binding)=32),
 greeting text not null default '' check(length(greeting)<=60),
 personal_message text not null default '' check(length(personal_message)<=300),
 issued_at timestamptz not null default now(), expires_at timestamptz not null,
 state text not null default 'pending' check(state in ('pending','redeemed','expired','revoked')),
 accepted_by uuid unique references auth.users(id), accepted_at timestamptz,
 welcome_gift text check (welcome_gift in ('starforged-circlet','moonlit-heirloom','rose-of-the-court','royal-midnight','celestial-dawn')),
 check ((state='redeemed')=(accepted_by is not null)),
 check ((accepted_at is not null)=(accepted_by is not null)),
 check (welcome_gift is null or state='redeemed'),
 check (issuer_id is distinct from accepted_by)
);
create unique index royal_seal_one_use on royal_invitation.letters(seal_id)
 where state in ('pending','redeemed');
create index royal_letter_issuer on royal_invitation.letters(issuer_id,issued_at);
create table royal_invitation.events (
 id bigint generated always as identity primary key,
 letter_id uuid references royal_invitation.letters(id),
 actor_id uuid not null references auth.users(id), event text not null,
 subject_id uuid references auth.users(id), seal_id uuid references royal_invitation.seals(id),
 occurred_at timestamptz not null default now()
);
-- No email address or reusable token is persisted. The 256-bit secret salts each
-- recipient binding independently. Supply parameters through a trusted server.
create function royal_invitation.binding(secret bytea, address text) returns bytea
 language sql immutable strict set search_path='' as $$
 select pg_catalog.sha256(secret || pg_catalog.convert_to(lower(trim(address)),'UTF8'))
$$;
create function royal_invitation.eligible(member uuid) returns boolean
 language sql stable set search_path='' as $$
 select exists(select 1 from auth.users u join private.member_age a on a.user_id=u.id
  where u.id=member and u.email_confirmed_at is not null and u.email is not null
    and (u.banned_until is null or u.banned_until<=now())
    and a.birth_date + interval '13 years' <= current_date)
$$;
create function royal_invitation.issue(actor uuid, request_id uuid, kind text, recipient text, secret bytea)
 returns uuid language plpgsql set search_path='' as $$
declare sender royal_invitation.issuers; settings royal_invitation.policy;
 assigned uuid; old royal_invitation.letters; address text := lower(trim(recipient));
begin
 select * into sender from royal_invitation.issuers where member_id=actor for update;
 if not found or not sender.enabled or not royal_invitation.eligible(actor) then raise exception 'Issuing unavailable'; end if;
 select * into strict settings from royal_invitation.policy;
 if sender.kind='envoy' and (not settings.member_sending or kind is distinct from 'royal') then raise exception 'Issuing unavailable'; end if;
 if kind is null or kind not in ('royal','honoured','founding') or
   (kind='founding' and not coalesce(settings.founding_window @> now(),false)) then raise exception 'Class unavailable'; end if;
 if request_id is null or secret is null or octet_length(secret)<>32 or address is null
   or length(address)>254 or address !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   or exists(select 1 from auth.users where id=actor and lower(trim(email))=address)
 then raise exception 'Invalid invitation'; end if;
 select * into old from royal_invitation.letters where id=request_id;
 if found then
   if old.issuer_id=actor and old.class=kind and old.state='pending' and old.expires_at>now()
    and old.token_hash=pg_catalog.sha256(secret) and old.recipient_binding=royal_invitation.binding(secret,address)
   then return old.id; end if;
   raise exception 'Request unavailable';
 end if;
 with expired as (update royal_invitation.letters set state='expired'
   where issuer_id=actor and state='pending' and expires_at<=now() returning id)
 insert into royal_invitation.events(letter_id,actor_id,event) select id,actor,'expired' from expired;
 if sender.kind='envoy' then
   select s.id into assigned from royal_invitation.seals s where s.owner_id=actor and s.expires_at>now()
    and not exists(select 1 from royal_invitation.letters l where l.seal_id=s.id and l.state in ('pending','redeemed'))
    order by s.expires_at,s.id limit 1;
   if assigned is null then raise exception 'No available seal'; end if;
 end if;
 insert into royal_invitation.letters(id,issuer_id,class,seal_id,token_hash,recipient_binding,expires_at)
 values(request_id,actor,kind,assigned,pg_catalog.sha256(secret),royal_invitation.binding(secret,address),
   now()+pg_catalog.make_interval(days=>settings.lifetime_days));
 insert into royal_invitation.events(letter_id,actor_id,event) values(request_id,actor,'issued');
 return request_id;
end $$;
create function royal_invitation.redeem(actor uuid, secret bytea) returns uuid
 language plpgsql set search_path='' as $$
declare letter royal_invitation.letters; account auth.users;
begin
 if secret is null or octet_length(secret)<>32 then raise exception 'Invitation unavailable'; end if;
 select * into letter from royal_invitation.letters where token_hash=pg_catalog.sha256(secret) for update;
 if not found or not royal_invitation.eligible(actor) then raise exception 'Invitation unavailable'; end if;
 if letter.state='redeemed' and letter.accepted_by=actor then return letter.id; end if;
 select * into account from auth.users where id=actor;
 if letter.state<>'pending' or letter.expires_at<=now() or actor=letter.issuer_id
   or account.created_at<letter.issued_at
   or letter.recipient_binding<>royal_invitation.binding(secret,account.email)
 then raise exception 'Invitation unavailable'; end if;
 update royal_invitation.letters set state='redeemed',accepted_by=actor,accepted_at=now() where id=letter.id;
 insert into royal_invitation.events(letter_id,actor_id,event) values(letter.id,actor,'redeemed');
 return letter.id;
end $$;
create function royal_invitation.revoke_letter(actor uuid, target uuid) returns boolean
 language plpgsql set search_path='' as $$
begin
 if not royal_invitation.eligible(actor) then return false; end if;
 update royal_invitation.letters set state='revoked' where id=target and state='pending' and
 (issuer_id=actor or exists(select 1 from royal_invitation.issuers where member_id=actor and enabled and kind='desk'));
 if not found then return false; end if;
 insert into royal_invitation.events(letter_id,actor_id,event) values(target,actor,'revoked');
 return true;
end $$;
create function royal_invitation.choose_gift(actor uuid, choice text) returns boolean
 language plpgsql set search_path='' as $$
declare letter uuid;
begin
 if not royal_invitation.eligible(actor) or choice is null or choice not in ('starforged-circlet','moonlit-heirloom','rose-of-the-court','royal-midnight','celestial-dawn') then return false; end if;
 update royal_invitation.letters set welcome_gift=choice where accepted_by=actor and state='redeemed'
   and welcome_gift is null returning id into letter;
 if not found then return exists(select 1 from royal_invitation.letters where accepted_by=actor and welcome_gift=choice); end if;
 insert into royal_invitation.events(letter_id,actor_id,event) values(letter,actor,'gift_selected');
 return true;
end $$;
-- A desk issuer must be provisioned separately after review. These operations
-- cannot provision another desk issuer. The audit is committed with the change.
create function royal_invitation.manage_envoy(actor uuid, member uuid, enabled_value boolean)
 returns void language plpgsql set search_path='' as $$
begin
 if not royal_invitation.eligible(actor) or not exists(select 1 from royal_invitation.issuers
   where member_id=actor and kind='desk' and enabled) then raise exception 'Desk approval required'; end if;
 if actor=member or enabled_value is null or (enabled_value and not royal_invitation.eligible(member))
 then raise exception 'Invalid nominee'; end if;
 insert into royal_invitation.issuers(member_id,kind,enabled) values(member,'envoy',enabled_value)
 on conflict(member_id) do update set enabled=excluded.enabled where royal_invitation.issuers.kind='envoy'
 and royal_invitation.issuers.enabled is distinct from excluded.enabled;
 if not found then return; end if;
 insert into royal_invitation.events(actor_id,subject_id,event) values(actor,member,
   case when enabled_value then 'envoy_approved' else 'envoy_suspended' end);
 if not enabled_value then
  with revoked as (update royal_invitation.letters set state='revoked' where issuer_id=member and state='pending' returning id)
  insert into royal_invitation.events(letter_id,actor_id,subject_id,event) select id,actor,member,'revoked' from revoked;
 end if;
end $$;
create function royal_invitation.allocate_quarter(actor uuid, member uuid) returns integer
 language plpgsql set search_path='' as $$
declare quarter_start timestamp := date_trunc('quarter',now() at time zone 'UTC'); allocated integer;
begin
 if not royal_invitation.eligible(actor) or not exists(select 1 from royal_invitation.issuers
 where member_id=actor and kind='desk' and enabled) then raise exception 'Desk approval required'; end if;
 perform 1 from royal_invitation.issuers where member_id=member and enabled and kind='envoy' for update;
 if not found or not royal_invitation.eligible(member) then raise exception 'Invalid nominee'; end if;
 with allocated_seals as (
   insert into royal_invitation.seals(owner_id,allocation_key,expires_at)
   select member,to_char(quarter_start,'YYYY-MM')||'-'||slot,
    (quarter_start+interval '3 months') at time zone 'UTC' from generate_series(1,(select quarterly_seals from royal_invitation.policy)) slot
   on conflict(owner_id,allocation_key) do nothing returning id)
 insert into royal_invitation.events(actor_id,subject_id,seal_id,event)
 select actor,member,id,'quarterly_seal' from allocated_seals;
 get diagnostics allocated=row_count;
 return allocated;
end $$;
create function royal_invitation.member_summary(actor uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object(
 'envoy',exists(select 1 from royal_invitation.issuers where member_id=actor and kind='envoy' and enabled),
 'desk',exists(select 1 from royal_invitation.issuers where member_id=actor and kind='desk' and enabled),
 'sending', (select member_sending from royal_invitation.policy),
 'available',(select count(*) from royal_invitation.seals s where owner_id=actor and expires_at>now()
  and not exists(select 1 from royal_invitation.letters l where l.seal_id=s.id and (l.state='redeemed' or (l.state='pending' and l.expires_at>now())))),
 'reserved',(select count(*) from royal_invitation.letters where issuer_id=actor and seal_id is not null and state='pending' and expires_at>now()),
 'accepted',(select count(*) from royal_invitation.letters where issuer_id=actor and state='redeemed'),
 'history',coalesce((select jsonb_agg(jsonb_build_object('id',id,'class',class,'issued',issued_at,'expires',expires_at,
 'status',case when state='pending' and expires_at<=now() then 'expired' else state end) order by issued_at desc,id)
 from royal_invitation.letters where issuer_id=actor),'[]'::jsonb),
 'keepsake',(select jsonb_build_object('class',class,'accepted',accepted_at,'gift',welcome_gift,'message',personal_message)
 from royal_invitation.letters where accepted_by=actor))
$$;

revoke all on all tables in schema royal_invitation from public,anon,authenticated,service_role;
revoke all on all sequences in schema royal_invitation from public,anon,authenticated,service_role;
revoke execute on all functions in schema royal_invitation from public,anon,authenticated,service_role;
commit;
