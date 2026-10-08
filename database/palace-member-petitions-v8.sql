-- Palace Council VIII: petitions and public decisions. Confidential moderation cases excluded.
create table if not exists public.palace_member_petitions (
  id uuid primary key default gen_random_uuid(),
  palace_id smallint not null references public.grand_palaces(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('community','creative','accessibility','events','platform','other')),
  title text not null check (char_length(title) between 12 and 140),
  description text not null check (char_length(description) between 50 and 1800),
  status text not null default 'open'
    check(status in ('open','acknowledged','under_review','supported','declined','implemented','closed','hidden')),
  submitted_at timestamptz not null default now(),
  support_closes_at timestamptz not null default (now()+interval '30 days'),
  updated_at timestamptz not null default now(),
  check (support_closes_at>submitted_at)
);
create table if not exists public.palace_petition_supports (
  petition_id uuid not null references public.palace_member_petitions(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  supported_at timestamptz not null default now(),
  primary key(petition_id,member_id)
);
create table if not exists public.palace_petition_responses (
  petition_id uuid primary key references public.palace_member_petitions(id) on delete cascade,
  responder_id uuid not null references public.profiles(id),
  responder_role text not null check(responder_role in ('representative','steward')),
  decision text not null check(decision in ('acknowledged','under_review','supported','declined','implemented','closed')),
  response_text text not null check(char_length(response_text) between 40 and 1800),
  responded_at timestamptz not null default now()
);
create table if not exists public.palace_petition_history (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.palace_member_petitions(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null check(action in ('created','responded','hidden')),
  public_summary text not null check(char_length(public_summary)<=250),
  happened_at timestamptz not null default now()
);
create index if not exists palace_petition_list_idx on public.palace_member_petitions(palace_id,submitted_at desc);
create index if not exists palace_petition_support_member_idx on public.palace_petition_supports(member_id,supported_at desc);
create index if not exists palace_petition_history_latest on public.palace_petition_history(petition_id,happened_at desc);
alter table public.palace_member_petitions enable row level security;
alter table public.palace_petition_supports enable row level security;
alter table public.palace_petition_responses enable row level security;
alter table public.palace_petition_history enable row level security;
revoke all on public.palace_member_petitions,public.palace_petition_supports,
 public.palace_petition_responses,public.palace_petition_history from public,anon,authenticated;

create or replace function public.submit_palace_petition(
 p_category text,p_title text,p_description text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_id uuid;
begin
 if v_user is null then raise exception 'Please sign in to submit a petition.';end if;
 select m.palace_id into v_palace from public.grand_palace_memberships m where m.user_id=v_user;
 if v_palace is null then raise exception 'Your Grand Palace must be assigned before you can submit a petition.';end if;
 if p_category not in ('community','creative','accessibility','events','platform','other') or
   length(btrim(coalesce(p_title,''))) not between 12 and 140 or
   length(btrim(coalesce(p_description,''))) not between 50 and 1800 then
   raise exception 'Select a category and add a title (12–140) and explanation (50–1800 characters).';
 end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),801);
 if (select count(*) from public.palace_member_petitions p
    where p.author_id=v_user and p.submitted_at>now()-interval '7 days')>=3 then
   raise exception 'You can publish up to three petitions every seven days.';
 end if;
 insert into public.palace_member_petitions(palace_id,author_id,category,title,description)
 values(v_palace,v_user,p_category,btrim(p_title),btrim(p_description))
 returning id into v_id;
 insert into public.palace_petition_supports(petition_id,member_id) values(v_id,v_user);
 insert into public.palace_petition_history(petition_id,actor_id,action,public_summary)
 values(v_id,v_user,'created','Petition opened for Grand Palace supporters.');
 return v_id;
end $$;

create or replace function public.toggle_palace_petition_support(p_petition uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;v_p public.palace_member_petitions%rowtype;v_exists boolean;v_total integer;
begin
 if v_user is null then raise exception 'Sign in to support a petition.';end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),hashtext(p_petition::text));
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 select * into v_p from public.palace_member_petitions where id=p_petition;
 if not found or v_p.status in ('hidden','closed','declined','implemented') or now()>=v_p.support_closes_at then
  raise exception 'This petition is not accepting support.';
 end if;
 if v_palace is distinct from v_p.palace_id then
  raise exception 'You may support petitions only in your assigned Grand Palace.';
 end if;
 select exists(select 1 from public.palace_petition_supports
  where petition_id=p_petition and member_id=v_user) into v_exists;
 if v_exists then
   if v_p.author_id=v_user then raise exception 'Petition authors cannot retract their initial support.';end if;
   delete from public.palace_petition_supports where petition_id=p_petition and member_id=v_user;
 else
   insert into public.palace_petition_supports(petition_id,member_id) values(p_petition,v_user);
 end if;
 select count(*) into v_total from public.palace_petition_supports where petition_id=p_petition;
 return jsonb_build_object('supported',not v_exists,'support_count',v_total);
end $$;

create or replace function public.respond_palace_petition(
 p_petition uuid,p_status text,p_response text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_pet public.palace_member_petitions%rowtype;v_role text;v_is_owner boolean;
begin
 if v_user is null then raise exception 'Sign in to respond as a representative.';end if;
 if p_status not in ('acknowledged','under_review','supported','declined','implemented','closed')
  or length(btrim(coalesce(p_response,''))) not between 40 and 1800 then
  raise exception 'Choose an official outcome and give a public explanation (40–1800 characters).';end if;
 select * into v_pet from public.palace_member_petitions where id=p_petition for update;
 if not found or v_pet.status='hidden' then raise exception 'This petition cannot be answered.';end if;
 v_is_owner:=private.has_platform_role(array['owner']::text[]);
 if exists(
  select 1 from public.palace_council_seats s
  where s.palace_id=v_pet.palace_id and s.representative_id=v_user
   and s.outcome='elected' and s.term_ends_at>now()
   and s.election_id=(select e.id from public.palace_council_elections e
     where exists(select 1 from public.palace_council_seats s2 where s2.election_id=e.id)
     order by e.voting_close desc limit 1)
 ) then v_role:='representative';
 elsif v_is_owner then v_role:='steward';
 else raise exception 'Only the current Grand Palace representative or Palace owner may answer a petition.';
 end if;
 if v_pet.status in ('declined','implemented','closed') and not v_is_owner then
  raise exception 'A concluded petition cannot be reopened by a representative.';
 end if;
 insert into public.palace_petition_responses(petition_id,responder_id,responder_role,decision,response_text)
 values(p_petition,v_user,v_role,p_status,btrim(p_response))
 on conflict(petition_id) do update set responder_id=excluded.responder_id,
 responder_role=excluded.responder_role,decision=excluded.decision,
 response_text=excluded.response_text,responded_at=now();
 update public.palace_member_petitions set status=p_status,updated_at=now() where id=p_petition;
 insert into public.palace_petition_history(petition_id,actor_id,action,public_summary)
 values(p_petition,v_user,'responded','Official Council response: '||replace(p_status,'_',' '));
 perform private.palace_case_notice(v_pet.author_id,'Your Palace petition has an answer',
  'An official response is available in the public Council petition record.',
  'council:petition:reply:'||p_petition::text||':'||p_status||':'||date_trunc('second',now())::text,
  'petitions');
 return jsonb_build_object('saved',true,'status',p_status);
end $$;

create or replace function public.hide_palace_petition(p_petition uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_author uuid;
begin
 if v_user is null or not private.has_platform_role(array['owner']::text[]) then
  raise exception 'Only the owner may hide a petition that violates public safety rules.';end if;
 if length(btrim(coalesce(p_reason,''))) not between 25 and 400 then
  raise exception 'Provide an explanation of 25–400 characters.';end if;
 update public.palace_member_petitions set status='hidden',updated_at=now()
 where id=p_petition and status<>'hidden' returning author_id into v_author;
 if not found then raise exception 'Petition not found or already hidden.';end if;
 insert into public.palace_petition_history(petition_id,actor_id,action,public_summary)
 values(p_petition,v_user,'hidden','Petition hidden from the public record for safety review.');
 perform private.palace_case_notice(v_author,'Your Palace petition was hidden',
 'A petition was taken off the public record. You can contact Council privately for further information.',
 'council:petition:hidden:'||p_petition::text,'petitions');
 return true;
end $$;

create or replace function public.get_palace_petition_hall(p_page integer default 0,p_palace smallint default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_my_palace smallint;
 v_page integer:=least(greatest(coalesce(p_page,0),0),10000);
begin
 if v_user is null then raise exception 'Sign in to see Palace petitions.';end if;
 select palace_id into v_my_palace from public.grand_palace_memberships where user_id=v_user;
 return jsonb_build_object('my_palace_id',v_my_palace,'is_owner',private.has_platform_role(array['owner']::text[]),
  'palaces',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'sigil',sigil,'accent',accent) order by id)
    from public.grand_palaces),'[]'::jsonb),
  'total',(select count(*) from public.palace_member_petitions
    where status<>'hidden' and (p_palace is null or palace_id=p_palace)),
  'page',v_page,
  'petitions',coalesce((
   select jsonb_agg(jsonb_build_object(
    'id',p.id,'palace_id',p.palace_id,'category',p.category,'title',p.title,
    'description',p.description,'status',p.status,'submitted_at',p.submitted_at,
    'support_closes_at',p.support_closes_at,
    'support_count',(select count(*) from public.palace_petition_supports s where s.petition_id=p.id),
    'supported_by_me',exists(select 1 from public.palace_petition_supports s where s.petition_id=p.id and s.member_id=v_user),
    'mine',p.author_id=v_user,
    'support_goal',least(5,greatest(2,ceil((
      select count(*)::numeric from public.grand_palace_memberships m
      where m.palace_id=p.palace_id)*0.25)::integer)),
    'responder_role',r.responder_role,'decision',r.decision,
    'response_text',r.response_text,'responded_at',r.responded_at,
    'history',coalesce((select jsonb_agg(jsonb_build_object('summary',h.public_summary,'at',h.happened_at)
       order by h.happened_at desc)
       from (select public_summary,happened_at from public.palace_petition_history h
        where h.petition_id=p.id and h.action in ('created','responded')
        order by h.happened_at desc limit 8)h),'[]'::jsonb),
    'can_reply',private.has_platform_role(array['owner']::text[])
      or exists(select 1 from public.palace_council_seats cs
        where cs.palace_id=p.palace_id and cs.representative_id=v_user
          and cs.outcome='elected' and cs.term_ends_at>now()
          and cs.election_id=(select e.id from public.palace_council_elections e
            where exists(select 1 from public.palace_council_seats s2 where s2.election_id=e.id)
            order by e.voting_close desc limit 1))
   ) order by p.submitted_at desc)
   from (select * from public.palace_member_petitions
    where status<>'hidden' and (p_palace is null or palace_id=p_palace)
    order by submitted_at desc limit 20 offset v_page*20)p
   left join public.palace_petition_responses r on r.petition_id=p.id
  ),'[]'::jsonb),
  'public_motions',coalesce((
    select jsonb_agg(jsonb_build_object('id',m.id,'palace_id',m.palace_id,'title',m.title,
    'description',m.description,'status',m.status,'category',m.category,
    'decision_note',m.decision_note,'created_at',m.created_at,'reviewed_at',m.reviewed_at)
    order by m.created_at desc)
    from (select * from public.palace_council_motions order by created_at desc limit 30)m
  ),'[]'::jsonb)
 );
end $$;

revoke all on function public.submit_palace_petition(text,text,text) from public,anon;
revoke all on function public.toggle_palace_petition_support(uuid) from public,anon;
revoke all on function public.respond_palace_petition(uuid,text,text) from public,anon;
revoke all on function public.hide_palace_petition(uuid,text) from public,anon;
revoke all on function public.get_palace_petition_hall(integer,smallint) from public,anon;
grant execute on function public.submit_palace_petition(text,text,text) to authenticated;
grant execute on function public.toggle_palace_petition_support(uuid) to authenticated;
grant execute on function public.respond_palace_petition(uuid,text,text) to authenticated;
grant execute on function public.hide_palace_petition(uuid,text) to authenticated;
grant execute on function public.get_palace_petition_hall(integer,smallint) to authenticated;