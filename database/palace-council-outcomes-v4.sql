create or replace function public.get_palace_council_outcomes()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_palace smallint;
begin
 if v_user is null then raise exception 'Sign in to view the Council.';end if;
 select palace_id into v_palace from public.grand_palace_memberships where user_id=v_user;
 return jsonb_build_object('my_palace_id',v_palace,
 'is_owner',private.has_platform_role(array['owner']::text[]),
 'seats',coalesce((select jsonb_agg(jsonb_build_object('election_id',s.election_id,
  'palace_id',s.palace_id,'palace_name',g.name,'outcome',s.outcome,
  'representative',p.display_name,'username',p.username,'term_ends_at',s.term_ends_at)
  order by s.palace_id)
 from public.palace_council_seats s join public.grand_palaces g on g.id=s.palace_id
 join public.palace_council_elections e on e.id=s.election_id
 left join public.profiles p on p.id=s.representative_id
 where s.election_id=(select election_id from public.palace_council_seats
 order by election_id desc limit 1)),'[]'::jsonb),
 'runoffs',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,
 'election_id',r.election_id,'palace_id',r.palace_id,'round_number',r.round_number,
 'closes_at',r.closes_at,'status',case when r.status='open' and now()>=r.closes_at then 'awaiting_certification' else r.status end,
 'my_vote',(select v.candidate_id from public.palace_council_runoff_votes v
 where v.runoff_id=r.id and v.voter_id=v_user),
 'candidates',coalesce((select jsonb_agg(jsonb_build_object('id',c.candidate_id,
 'name',p.display_name,'username',p.username,
 'votes',case when now()>=r.closes_at then
 (select count(*) from public.palace_council_runoff_votes v
 where v.runoff_id=r.id and v.candidate_id=c.candidate_id)
 else null end))
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
 where s.representative_id=v_user and s.outcome='elected' and s.term_ends_at>now()));
end $$;
revoke all on function public.get_palace_council_outcomes() from public,anon;
grant execute on function public.get_palace_council_outcomes() to authenticated;
create or replace function public.get_my_palace_appeals()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in to review your appeals.';end if;
 return jsonb_build_object('reports',coalesce((select jsonb_agg(jsonb_build_object(
 'id',r.id,'reason',r.reason,'status',r.status,'created_at',r.created_at,
 'appeal',case when a.id is null then null else jsonb_build_object('status',a.status,
 'appeal_text',a.appeal_text,'review_note',a.review_note,'created_at',a.created_at) end)
 order by r.created_at desc)
 from public.community_reports r left join public.palace_case_appeals a
 on a.report_id=r.id and a.appellant_id=v_user
 where r.reporter_id=v_user order by r.created_at desc limit 40),'[]'::jsonb));
end $$;
revoke all on function public.get_my_palace_appeals() from public,anon;
grant execute on function public.get_my_palace_appeals() to authenticated;