-- Grand Palace Ceremony Hall
-- Read-only, authenticated Palace history derived from authoritative season scores
-- and existing award ledgers. No extra points, gifts or rankings are minted.
create or replace function public.get_grand_palace_ceremony_hall()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 v_member uuid:=auth.uid();
 v_season date:=date_trunc('quarter',now() at time zone 'UTC')::date;
 v_result jsonb;
begin
 if v_member is null then
   raise exception 'Sign in to visit the Grand Palace Ceremony Hall.';
 end if;
 if not exists(select 1 from public.grand_palace_memberships where user_id=v_member) then
   raise exception 'Your Grand Palace membership is unavailable.';
 end if;
 select jsonb_build_object(
  'quarter_start',v_season,
  'my_palace_id',(select palace_id from public.grand_palace_memberships where user_id=v_member),
  'courts',coalesce((
     with members as (
      select palace_id,count(*)::integer as member_count
      from public.grand_palace_memberships group by palace_id
     ),scores as (
      select palace_id,sum(points)::bigint as total_points,
             count(distinct user_id)::integer as contributors,
             count(distinct day_utc)::integer as active_days
      from public.grand_palace_daily_scores
      where quarter_start=v_season group by palace_id
     ),rituals as (
      select palace_id,count(*)::integer as ritual_count
      from public.grand_palace_daily_rituals
      where day_utc>=v_season and day_utc<(v_season+interval '3 months')::date
      group by palace_id
     ),wins as (
      select winner_id,count(*)::integer as total_wins
      from public.grand_palace_seasons
      where status='finalized' and winner_id is not null group by winner_id
     )
     select jsonb_agg(jsonb_build_object(
       'id',p.id,'slug',p.slug,'name',p.name,
       'member_count',coalesce(m.member_count,0),
       'points',coalesce(s.total_points,0),
       'contributors',coalesce(s.contributors,0),
       'active_days',coalesce(s.active_days,0),
       'ritual_count',coalesce(r.ritual_count,0),
       'average_points',round(coalesce(s.total_points,0)::numeric /
                                  greatest(coalesce(m.member_count,0),1),2),
       'victories',coalesce(w.total_wins,0)
     ) order by p.id)
     from public.grand_palaces p
     left join members m on m.palace_id=p.id
     left join scores s on s.palace_id=p.id
     left join rituals r on r.palace_id=p.id
     left join wins w on w.winner_id=p.id
  ),'[]'::jsonb),
  'chronicle',coalesce((
    select jsonb_agg(jsonb_build_object(
      'quarter_start',s.quarter_start,
      'winner_id',s.winner_id,
      'winner_name',p.name,
      'winner_sigil',p.sigil,
      'closed_at',s.finalized_at,
      'verified_points',coalesce((select sum(d.points)
        from public.grand_palace_daily_scores d
        where d.quarter_start=s.quarter_start and d.palace_id=s.winner_id),0),
      'champions',coalesce((
        select jsonb_agg(jsonb_build_object(
         'username',u.username,'display_name',u.display_name,
         'avatar_url',u.avatar_url,'title',u.title,
         'rank',a.individual_rank,'box_tier',a.box_tier)
         order by a.individual_rank)
        from public.grand_palace_awards a
        join public.profiles u on u.id=a.user_id
        where a.quarter_start=s.quarter_start
          and a.award_kind='top_ten_box'
          and a.individual_rank between 1 and 10
          and u.visibility='public'
        ),'[]'::jsonb)
      ) order by s.quarter_start desc)
    from (
      select quarter_start,winner_id,finalized_at
      from public.grand_palace_seasons
      where status='finalized' and winner_id is not null
      order by quarter_start desc limit 20
    )s join public.grand_palaces p on p.id=s.winner_id
   ),'[]'::jsonb),
  'new_laurels',coalesce((
    select jsonb_agg(jsonb_build_object(
      'palace_id',milestones.palace_id,
      'username',milestones.username,
      'display_name',milestones.display_name,
      'avatar_url',milestones.avatar_url,
      'achievement_name',milestones.achievement_name,
      'tier',milestones.tier,
      'earned_at',milestones.earned_at
     ) order by milestones.earned_at desc)
    from (
      select m.palace_id,u.username,u.display_name,u.avatar_url,
        f.name as achievement_name,
        case when a.emerald_unlocked_at is not null then 'emerald'
             else 'platinum' end as tier,
        coalesce(a.emerald_unlocked_at,a.platinum_unlocked_at) as earned_at
      from public.user_achievement_progress a
      join public.achievement_families f on f.id=a.achievement_id
      join public.profiles u on u.id=a.user_id
      join public.grand_palace_memberships m on m.user_id=u.id
      where u.visibility='public'
        and coalesce(a.emerald_unlocked_at,a.platinum_unlocked_at)>=v_season::timestamptz
      order by coalesce(a.emerald_unlocked_at,a.platinum_unlocked_at) desc
      limit 12
    )milestones
   ),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;

revoke all on function public.get_grand_palace_ceremony_hall() from public,anon;
grant execute on function public.get_grand_palace_ceremony_hall() to authenticated;
