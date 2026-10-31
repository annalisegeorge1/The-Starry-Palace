-- THE STARRY PALACE — PROPOSED ONLY. Do not apply to production.
-- Age-aware award eligibility, preserving existing amounts, caps, idempotency,
-- signature, return values and grants. Synthetic-identity staging required.

create or replace function public.record_palace_share(p_work_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_author uuid;
  v_week text := to_char(now(),'IYYY-IW');
  v_given integer := 0;
  v_received integer := 0;
  v_today integer := 0;
begin
  if v_user is null then raise exception 'Sign in to gather Celestial Points from sharing.'; end if;

  select w.author_id into v_author
  from public.works w
  where w.id=p_work_id
    and w.publication_status='published'
    and w.visibility in ('public','members')
    and private.member_meets_age(w.minimum_reader_age);

  if v_author is null then raise exception 'This work is not available to share.'; end if;
  if v_author=v_user then
    return jsonb_build_object('giver_points_awarded_now',0,'receiver_points_awarded_now',0);
  end if;

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

-- Tests: age-ineligible member cannot award self/recipient points by known ID;
-- eligible readers preserve historical weekly idempotency and daily caps;
-- owners still receive no self-share points; no anonymous awards.
