-- THE STARRY PALACE — PROPOSED REVIEW ONLY; DO NOT APPLY TO PRODUCTION
-- 2026-10-31: Restrict aggregate praise reads to work/chapter audiences.
-- Uses the same eligibility helpers as the live works and chapters RLS rules.
-- Role-separated tests in staging are required BEFORE deployment.
-- Existing grants and function signature are intentionally unchanged.

create or replace function public.get_palace_praise_state(
  p_target_kind text,
  p_target_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_allowed boolean := false;
  v_counts jsonb;
  v_mine text;
begin
  if p_target_kind not in ('work', 'chapter') then
    raise exception 'Unknown praise target.';
  end if;

  -- SECURITY DEFINER bypasses table RLS: enforce reader eligibility here.
  if p_target_kind = 'work' then
    select exists(
      select 1 from public.works w
      where w.id = p_target_id
        and (
          private.is_work_owner(w.id)
          or private.is_accepted_work_collaborator(w.id)
          or (
            w.publication_status = 'published'
            and (
              w.visibility = 'public'
              or (w.visibility = 'members' and v_user is not null)
            )
            and private.member_meets_age(w.minimum_reader_age)
          )
        )
    ) into v_allowed;
  else
    select exists(
      select 1 from public.chapters c
      where c.id = p_target_id
        and private.can_read_chapter(c.work_id, c.status)
    ) into v_allowed;
  end if;

  -- Non-existent and inaccessible targets produce the same neutral result.
  if not coalesce(v_allowed, false) then
    return jsonb_build_object(
      'praise', null,
      'counts', jsonb_build_object(
        'heart', 0, 'star', 0, 'moon', 0, 'crown', 0
      )
    );
  end if;

  select jsonb_build_object(
    'heart', count(*) filter(where praise_type = 'heart'),
    'star', count(*) filter(where praise_type = 'star'),
    'moon', count(*) filter(where praise_type = 'moon'),
    'crown', count(*) filter(where praise_type = 'crown')
  ) into v_counts
  from public.palace_praises
  where target_kind = p_target_kind and target_id = p_target_id;

  if v_user is not null then
    select praise_type into v_mine
    from public.palace_praises
    where giver_id = v_user and target_kind = p_target_kind and target_id = p_target_id;
  end if;

  return jsonb_build_object('praise', v_mine, 'counts', v_counts);
end
$function$;

-- Staging acceptance expectations (run with synthetic identities):
-- anon: public published work -> counts; members-only/hidden/draft -> zeros.
-- ordinary signed-in: member-only age-eligible -> counts; other drafts -> zeros.
-- owner/collaborator: own/private work -> counts.
-- chapter: unpublished chapters -> owner/editor only.
-- unknown target IDs -> zeros, not an existence indication.
