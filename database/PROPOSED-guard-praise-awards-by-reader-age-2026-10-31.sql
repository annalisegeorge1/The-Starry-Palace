-- THE STARRY PALACE — PROPOSED ONLY. Not applied to production.
-- A privileged RPC must enforce the target's reading-age requirement before
-- changing reactions or awarding points. Preserve prior reward economics.
-- Staging with synthetic signed-in identities required before adoption.

create or replace function public.give_palace_praise(
  p_target_kind text, p_target_id uuid, p_praise_type text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_receiver uuid;
  v_praise public.palace_praises%rowtype;
  v_giver_goal integer;
  v_receiver_goal integer;
  v_giver_delta integer := 0;
  v_receiver_delta integer := 0;
  v_giver_today integer := 0;
  v_receiver_today integer := 0;
  v_type_today integer := 0;
  v_type_limit integer;
  v_counts jsonb;
begin
  if v_user is null then raise exception 'Sign in to leave Palace praise.'; end if;
  if p_praise_type not in ('heart','star','moon','crown') then raise exception 'Unknown Palace praise.'; end if;
  if p_target_kind not in ('work','chapter') then raise exception 'Unknown praise target.'; end if;

  if p_target_kind='work' then
    select w.author_id into v_receiver
    from public.works w
    where w.id=p_target_id and w.publication_status='published'
      and w.visibility in ('public','members')
      and private.member_meets_age(w.minimum_reader_age);
  else
    select w.author_id into v_receiver
    from public.chapters c
    join public.works w on w.id=c.work_id
    where c.id=p_target_id and c.status='published' and w.publication_status='published'
      and w.visibility in ('public','members')
      and private.member_meets_age(w.minimum_reader_age);
  end if;

  if v_receiver is null then raise exception 'This work is not available for praise.'; end if;
  if v_receiver=v_user then raise exception 'Palace praise is for another creator.'; end if;

  v_giver_goal := case p_praise_type when 'heart' then 1 when 'star' then 2 when 'moon' then 3 when 'crown' then 5 end;
  v_receiver_goal := case p_praise_type when 'heart' then 1 when 'star' then 3 when 'moon' then 5 when 'crown' then 8 end;
  v_type_limit := case p_praise_type when 'heart' then 20 when 'star' then 6 when 'moon' then 3 when 'crown' then 1 end;

  insert into public.palace_praises(giver_id,receiver_id,target_kind,target_id,praise_type)
  values(v_user,v_receiver,p_target_kind,p_target_id,p_praise_type)
  on conflict(giver_id,target_kind,target_id)
  do update set praise_type=excluded.praise_type,receiver_id=excluded.receiver_id,updated_at=now()
  returning * into v_praise;

  select coalesce(sum(points),0)::int into v_giver_today
  from public.celestial_point_ledger
  where user_id=v_user and channel='giving' and created_at>=date_trunc('day',now());

  select coalesce(sum(points),0)::int into v_receiver_today
  from public.celestial_point_ledger
  where user_id=v_receiver and channel='receiving' and created_at>=date_trunc('day',now());

  select count(*)::int into v_type_today
  from public.palace_praises
  where giver_id=v_user and praise_type=p_praise_type and updated_at>=date_trunc('day',now());

  if v_type_today <= v_type_limit then
    v_giver_delta := greatest(0,least(
      v_giver_goal-v_praise.giver_points_awarded,
      greatest(0,20-v_giver_today)
    ));
    v_receiver_delta := greatest(0,least(
      v_receiver_goal-v_praise.receiver_points_awarded,
      greatest(0,50-v_receiver_today)
    ));
  end if;

  if v_giver_delta>0 then
    v_giver_delta := private.grant_celestial_points(
      v_user,v_giver_delta,'giving','praise_given',p_target_kind,p_target_id,v_receiver,
      'praise:'||v_praise.id||':giver:'||(v_praise.giver_points_awarded+v_giver_delta)
    );
  end if;
  if v_receiver_delta>0 then
    v_receiver_delta := private.grant_celestial_points(
      v_receiver,v_receiver_delta,'receiving','praise_received',p_target_kind,p_target_id,v_user,
      'praise:'||v_praise.id||':receiver:'||(v_praise.receiver_points_awarded+v_receiver_delta)
    );
  end if;

  update public.palace_praises
  set giver_points_awarded=giver_points_awarded+v_giver_delta,
      receiver_points_awarded=receiver_points_awarded+v_receiver_delta,
      updated_at=now()
  where id=v_praise.id
  returning * into v_praise;

  select jsonb_build_object(
    'heart',count(*) filter(where praise_type='heart'),
    'star',count(*) filter(where praise_type='star'),
    'moon',count(*) filter(where praise_type='moon'),
    'crown',count(*) filter(where praise_type='crown')
  ) into v_counts
  from public.palace_praises
  where target_kind=p_target_kind and target_id=p_target_id;

  return jsonb_build_object(
    'praise',v_praise.praise_type,
    'counts',v_counts,
    'giver_points_awarded_now',v_giver_delta,
    'receiver_points_awarded_now',v_receiver_delta
  );
end
$function$;

-- Synthetic tests: 13–17-year-old cannot praise an 18+ published work or chapter,
-- including when guessing UUID. Adult eligible member retains all praise types
-- and identical per-day caps. Self-praise and guest calls remain rejected.
