create or replace function public.get_palace_council_outcomes()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint; v_election uuid;
begin
 if v_user is null then raise exception 'Sign in to view the Council.';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 select e.id into v_election from public.palace_council_elections e
 where exists(select 1 from public.palace_council_seats s where s.election_id=e.id)
 order by e.voting_close desc limit 1;
 return jsonb_build_object('my_palace_id',v_palace,'is_owner',private.has_platform_role(array['owner']::text[]),
 'seats',coalesce((select jsonb_agg(jsonb_build_object('palace_id',s.palace_id,'palace_name',g.name,
 'outcome',s.outcome,'representative',p.display_name,'username',p.username,'term_ends_at',s.term_ends_at)
 order by s.palace_id)
 from public.palace_council_seats s join public.grand_palaces g on g.id=s.palace_id
 left join public.profiles p on p.id=s.representative_id where s.election_id=v_election),'[]'::jsonb),
 'runoffs',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,
 'palace_id',r.palace_id,'round_number',r.round_number,'closes_at',r.closes_at,
 'status',case when r.status='open' and now()>=r.closes_at then 'awaiting_certification' else r.status end,
 'my_vote',(select v.candidate_id from public.palace_council_runoff_votes v
 where v.runoff_id=r.id and v.voter_id=v_user),
 'candidates',coalesce((select jsonb_agg(jsonb_build_object('id',c.candidate_id,
 'name',p.display_name,'username',p.username,'votes',case when now()>=r.closes_at
 then (select count(*) from public.palace_council_runoff_votes v
 where v.runoff_id=r.id and v.candidate_id=c.candidate_id) else null end))
 from public.palace_council_runoff_candidates c join public.profiles p on p.id=c.candidate_id
 where c.runoff_id=r.id),'[]'::jsonb)) order by r.starts_at desc)
 from (select * from public.palace_council_runoffs
 where palace_id=v_palace or private.has_platform_role(array['owner']::text[])
 order by starts_at desc limit 15)r),'[]'::jsonb),
 'motions',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,
 'description',m.description,'category',m.category,'status',m.status,
 'decision_note',m.decision_note,'palace_id',m.palace_id,'created_at',m.created_at)
 order by m.created_at desc)
 from (select * from public.palace_council_motions order by created_at desc limit 30)m),'[]'::jsonb),
 'may_propose',exists(select 1 from public.palace_council_seats s
 where s.representative_id=v_user and s.outcome='elected' and s.term_ends_at>now()
 and s.election_id=v_election));
end $$;