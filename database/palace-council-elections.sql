-- Advisory elections: one representative per Grand Palace, no moderation permissions.
create table if not exists public.palace_council_elections(
 id uuid primary key default gen_random_uuid(),
 title text not null,
 created_by uuid not null references public.profiles(id),
 nominations_close timestamptz not null,
 voting_close timestamptz not null,
 status text not null default 'nominations' check(status in ('nominations','voting','closed','cancelled')),
 created_at timestamptz not null default now(),
 check(voting_close>nominations_close)
);
create table if not exists public.palace_council_candidates(
 election_id uuid not null references public.palace_council_elections(id) on delete cascade,
 candidate_id uuid not null references public.profiles(id) on delete cascade,
 palace_id smallint not null references public.grand_palaces(id),
 statement text not null check(char_length(statement) between 30 and 800),
 created_at timestamptz not null default now(),
 primary key(election_id,candidate_id)
);
create table if not exists public.palace_council_election_votes(
 election_id uuid not null references public.palace_council_elections(id) on delete cascade,
 voter_id uuid not null references public.profiles(id) on delete cascade,
 candidate_id uuid not null,
 palace_id smallint not null references public.grand_palaces(id),
 cast_at timestamptz not null default now(),
 primary key(election_id,voter_id),
 foreign key(election_id,candidate_id) references public.palace_council_candidates(election_id,candidate_id)
);
alter table public.palace_council_elections enable row level security;
alter table public.palace_council_candidates enable row level security;
alter table public.palace_council_election_votes enable row level security;
revoke all on public.palace_council_elections,public.palace_council_candidates,public.palace_council_election_votes from public,anon,authenticated;
create or replace function public.start_palace_council_election(p_title text default 'Grand Palace Council Election')
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not private.has_platform_role(array['owner']::text[]) then
  raise exception 'Only the Palace owner may schedule Council elections.';end if;
 if length(btrim(p_title)) not between 8 and 120 then raise exception 'Add a clear election title.';end if;
 if exists(select 1 from public.palace_council_elections
 where status in ('nominations','voting') and voting_close>now()) then
 raise exception 'Finish the current Council election before starting another.';end if;
 insert into public.palace_council_elections(title,created_by,nominations_close,voting_close)
 values(btrim(p_title),v_user,now()+interval '7 days',now()+interval '14 days')
 returning id into v_id;
 return v_id;
end $$;
create or replace function public.nominate_palace_council_candidate(p_election uuid,p_statement text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;
begin
 if v_user is null then raise exception 'Sign in to nominate yourself.';end if;
 if not exists(select 1 from public.palace_council_elections where id=p_election
 and status='nominations' and now()<nominations_close) then
 raise exception 'Nominations are closed.';end if;
 if length(btrim(coalesce(p_statement,''))) not between 30 and 800 then
 raise exception 'Write a short statement of 30–800 characters.';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null then raise exception 'Join your Grand Palace first.';end if;
 insert into public.palace_council_candidates(election_id,candidate_id,palace_id,statement)
 values(p_election,v_user,v_palace,btrim(p_statement))
 on conflict(election_id,candidate_id) do update set statement=excluded.statement;
 return true;
end $$;
create or replace function public.cast_palace_council_election_vote(p_election uuid,p_candidate uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;
begin
 if v_user is null then raise exception 'Sign in to vote.';end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),hashtext(p_election::text));
 if not exists(select 1 from public.palace_council_elections where id=p_election
 and status in ('nominations','voting') and now()>=nominations_close and now()<voting_close)
 then raise exception 'The election is not in its voting period.';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 if v_palace is null or not exists(select 1 from public.palace_council_candidates
 where election_id=p_election and candidate_id=p_candidate and palace_id=v_palace) then
 raise exception 'You may vote only for a candidate from your own Palace.';end if;
 insert into public.palace_council_election_votes(election_id,voter_id,candidate_id,palace_id)
 values(p_election,v_user,p_candidate,v_palace)
 on conflict(election_id,voter_id) do update set
 candidate_id=excluded.candidate_id,cast_at=now();
 return true;
end $$;
create or replace function public.get_palace_council_elections()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;
begin
 if v_user is null then raise exception 'Sign in to see Council elections.';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 return jsonb_build_object('my_palace_id',v_palace,
 'is_owner',private.has_platform_role(array['owner']::text[]),
 'elections',coalesce((
 select jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'status',
 case when e.status='cancelled' then 'cancelled'
 when now()>=e.voting_close then 'closed'
 when now()>=e.nominations_close then 'voting' else 'nominations' end,
 'nominations_close',e.nominations_close,'voting_close',e.voting_close,
 'my_vote',(select v.candidate_id from public.palace_council_election_votes v
 where v.election_id=e.id and v.voter_id=v_user),
 'candidates',coalesce((
 select jsonb_agg(jsonb_build_object('candidate_id',c.candidate_id,
 'palace_id',c.palace_id,'statement',c.statement,'display_name',p.display_name,
 'username',p.username,'votes',case when now()>=e.voting_close
 then (select count(*) from public.palace_council_election_votes v
 where v.election_id=e.id and v.candidate_id=c.candidate_id)
 else null end) order by c.palace_id,p.display_name)
 from public.palace_council_candidates c join public.profiles p on p.id=c.candidate_id
 where c.election_id=e.id
 ),'[]'::jsonb)) order by e.created_at desc)
 from (select * from public.palace_council_elections order by created_at desc limit 6)e
 ),'[]'::jsonb));
end $$;
revoke all on function public.start_palace_council_election(text) from public,anon;
revoke all on function public.nominate_palace_council_candidate(uuid,text) from public,anon;
revoke all on function public.cast_palace_council_election_vote(uuid,uuid) from public,anon;
revoke all on function public.get_palace_council_elections() from public,anon;
grant execute on function public.start_palace_council_election(text) to authenticated;
grant execute on function public.nominate_palace_council_candidate(uuid,text) to authenticated;
grant execute on function public.cast_palace_council_election_vote(uuid,uuid) to authenticated;
grant execute on function public.get_palace_council_elections() to authenticated;
