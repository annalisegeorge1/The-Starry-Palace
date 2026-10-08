-- Enforce published work visibility before any points can be earned for praise or sharing.
-- Both RPCs execute as SECURITY DEFINER and therefore must repeat visibility
-- checks normally enforced by the works/chapters RLS policies.
-- These functions already require auth.uid() to be non-null, so published
-- 'public' and 'members' work is eligible; private/hidden work is not.
-- Point values, caps, idempotency, signatures and all existing grants remain as-is.

CREATE OR REPLACE FUNCTION public.give_palace_praise(p_target_kind text, p_target_id uuid, p_praise_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      and w.visibility in ('public','members');
  else
    select w.author_id into v_receiver
    from public.chapters c
    join public.works w on w.id=c.work_id
    where c.id=p_target_id and c.status='published' and w.publication_status='published'
      and w.visibility in ('public','members');
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

CREATE OR REPLACE FUNCTION public.record_palace_share(p_work_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := auth.uid();
  v_author uuid;
  v_week text := to_char(now(),'IYYY-IW');
  v_given integer := 0;
  v_received integer := 0;
  v_today integer := 0;
begin
  if v_user is null then raise exception 'Sign in to gather Celestial Points from sharing.'; end if;

  select author_id into v_author
  from public.works
  where id=p_work_id and publication_status='published'
    and visibility in ('public','members');

  if v_author is null then raise exception 'This work is not available to share.'; end if;
  if v_author=v_user then return jsonb_build_object('giver_points_awarded_now',0,'receiver_points_awarded_now',0); end if;

  select coalesce(sum(points),0)::int into v_today
  from public.celestial_point_ledger
  where user_id=v_user and channel='participation' and created_at>=date_trunc('day',now());

  if v_today < 15 then
    v_given := private.grant_celestial_points(
      v_user,least(2,15-v_today),'participation','work_shared','work',p_work_id,v_author,
      'share:'||v_user||':'||p_work_id||':'||v_week||':giver'
    );
  end if;

  v_received := private.grant_celestial_points(
    v_author,1,'receiving','work_shared_by_reader','work',p_work_id,v_user,
    'share:'||v_user||':'||p_work_id||':'||v_week||':receiver'
  );

  return jsonb_build_object('giver_points_awarded_now',v_given,'receiver_points_awarded_now',v_received);
end
$function$;
