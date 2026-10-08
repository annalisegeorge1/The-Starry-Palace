
-- Palace Council V: a public service record for elected representatives.
-- This grants no moderation role or access to private cases.
create table if not exists public.palace_council_service_profiles(
 election_id uuid not null,
 palace_id smallint not null,
 representative_id uuid not null references public.profiles(id) on delete cascade,
 priorities text not null default '',
 availability_note text not null default '',
 updated_at timestamptz not null default now(),
 primary key(election_id,palace_id),
 foreign key(election_id,palace_id) references public.palace_council_seats(election_id,palace_id) on delete cascade,
 check(length(priorities)<=500 and length(availability_note)<=220)
);
create table if not exists public.palace_council_service_entries(
 id uuid primary key default gen_random_uuid(),
 election_id uuid not null,
 palace_id smallint not null,
 representative_id uuid not null references public.profiles(id) on delete cascade,
 activity_type text not null check(activity_type in ('listening_session','creative_event','accessibility','motion_update','community_support')),
 title text not null check(length(title) between 8 and 120),
 summary text not null check(length(summary) between 30 and 1000),
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 foreign key(election_id,palace_id) references public.palace_council_seats(election_id,palace_id) on delete cascade
);
create index if not exists palace_council_service_recent on public.palace_council_service_entries(election_id,palace_id,created_at desc);
alter table public.palace_council_service_profiles enable row level security;
alter table public.palace_council_service_entries enable row level security;
revoke all on public.palace_council_service_profiles,public.palace_council_service_entries from public,anon,authenticated;

create or replace function private.active_council_seat(p_user uuid)
returns table(election_id uuid,palace_id smallint)
language sql stable security definer set search_path='' as $$
 select s.election_id,s.palace_id
 from public.palace_council_seats s
 join public.palace_council_elections e on e.id=s.election_id
 where s.representative_id=p_user and s.outcome='elected' and s.term_ends_at>now()
 and s.election_id=(select e2.id from public.palace_council_elections e2
   where exists(select 1 from public.palace_council_seats s2 where s2.election_id=e2.id)
   order by e2.voting_close desc limit 1)
 limit 1
$$;
revoke all on function private.active_council_seat(uuid) from public,anon,authenticated;

create or replace function public.update_my_council_service_profile(p_priorities text,p_availability text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_e uuid;v_p smallint;
begin
 if v_user is null then raise exception 'Sign in to update your Council profile.';end if;
 select election_id,palace_id into v_e,v_p from private.active_council_seat(v_user);
 if v_e is null then raise exception 'Only a seated representative may edit their service profile.';end if;
 if length(btrim(coalesce(p_priorities,''))) not between 20 and 500
 or length(coalesce(p_availability,''))>220 then
 raise exception 'Write 20–500 characters about your public priorities and up to 220 about your availability.';end if;
 insert into public.palace_council_service_profiles
 (election_id,palace_id,representative_id,priorities,availability_note)
 values(v_e,v_p,v_user,btrim(p_priorities),btrim(coalesce(p_availability,'')))
 on conflict(election_id,palace_id) do update
 set priorities=excluded.priorities,availability_note=excluded.availability_note,
 representative_id=excluded.representative_id,updated_at=now();
 return true;
end $$;

create or replace function public.log_my_council_service(p_kind text,p_title text,p_summary text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_e uuid;v_p smallint;v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to record Council service.';end if;
 select election_id,palace_id into v_e,v_p from private.active_council_seat(v_user);
 if v_e is null then raise exception 'Only current representatives may record service.';end if;
 if p_kind not in ('listening_session','creative_event','accessibility','motion_update','community_support')
 or length(btrim(coalesce(p_title,''))) not between 8 and 120
 or length(btrim(coalesce(p_summary,''))) not between 30 and 1000 then
 raise exception 'Choose an allowed activity and include an informative title and summary.';end if;
 if (select count(*) from public.palace_council_service_entries
     where representative_id=v_user and created_at>now()-interval '7 days')>=8 then
 raise exception 'Up to eight public service updates may be logged each week.';end if;
 insert into public.palace_council_service_entries
 (election_id,palace_id,representative_id,activity_type,title,summary)
 values(v_e,v_p,v_user,p_kind,btrim(p_title),btrim(p_summary))
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.get_palace_council_service_registry()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_e uuid;v_mine uuid;
begin
 if v_user is null then raise exception 'Sign in to view Council service.';end if;
 select e.id into v_e from public.palace_council_elections e
 where exists(select 1 from public.palace_council_seats s where s.election_id=e.id)
 order by e.voting_close desc limit 1;
 select s.representative_id into v_mine
 from private.active_council_seat(v_user) a join public.palace_council_seats s
 on s.election_id=a.election_id and s.palace_id=a.palace_id;
 return jsonb_build_object('my_representative_id',v_mine,
 'election_id',v_e,
 'representatives',coalesce((select jsonb_agg(jsonb_build_object(
 'palace_id',s.palace_id,'palace_name',g.name,'palace_accent',g.accent,
 'representative_id',s.representative_id,'username',p.username,
 'display_name',p.display_name,'seated_at',s.seated_at,
 'term_ends_at',s.term_ends_at,'candidate_statement',c.statement,
 'priorities',coalesce(sp.priorities,''),'availability_note',coalesce(sp.availability_note,''),
 'motion_count',(select count(*) from public.palace_council_motions m
    where m.election_id=s.election_id and m.author_id=s.representative_id),
 'motions_resolved',(select count(*) from public.palace_council_motions m
    where m.election_id=s.election_id and m.author_id=s.representative_id
    and m.status in ('accepted','declined')),
 'service_count',(select count(*) from public.palace_council_service_entries a
    where a.election_id=s.election_id and a.palace_id=s.palace_id
    and a.representative_id=s.representative_id),
 'recent_entries',coalesce((select jsonb_agg(jsonb_build_object(
 'id',a.id,'activity_type',a.activity_type,'title',a.title,'summary',a.summary,
 'occurred_at',a.occurred_at) order by a.created_at desc)
 from (select * from public.palace_council_service_entries a
       where a.election_id=s.election_id and a.palace_id=s.palace_id
       and a.representative_id=s.representative_id
       order by a.created_at desc limit 6)a),'[]'::jsonb)
 ) order by s.palace_id)
 from public.palace_council_seats s
 join public.grand_palaces g on g.id=s.palace_id
 join public.profiles p on p.id=s.representative_id
 left join public.palace_council_candidates c
   on c.election_id=s.election_id and c.candidate_id=s.representative_id
 left join public.palace_council_service_profiles sp
   on sp.election_id=s.election_id and sp.palace_id=s.palace_id
 where s.election_id=v_e and s.outcome='elected' and s.term_ends_at>now()),'[]'::jsonb));
end $$;
revoke all on function public.update_my_council_service_profile(text,text) from public,anon;
revoke all on function public.log_my_council_service(text,text,text) from public,anon;
revoke all on function public.get_palace_council_service_registry() from public,anon;
grant execute on function public.update_my_council_service_profile(text,text) to authenticated;
grant execute on function public.log_my_council_service(text,text,text) to authenticated;
grant execute on function public.get_palace_council_service_registry() to authenticated;
