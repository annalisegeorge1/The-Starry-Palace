-- THE STARRY PALACE — PROPOSED REVIEW ONLY. NOT APPLIED TO PRODUCTION.
-- Prevent published lore entries from revealing the title/ID of a linked
-- unpublished chapter through the privileged get_work_lore RPC.
-- The author still sees their unpublished unlock chapters and all their lore.
-- Preserve work-level public/member/age checks and existing JSON response keys.
-- Validate with synthetic authors, guests, members and collaborators in staging.

create or replace function public.get_work_lore(p_work_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_progress_chapter uuid;
  v_progress_position integer := 0;
  v_result jsonb;
begin
  select author_id into v_owner
  from public.works where id = p_work_id;
  if v_owner is null then return '[]'::jsonb; end if;

  select rp.chapter_id into v_progress_chapter
  from public.reading_progress rp
  where rp.user_id = v_user and rp.work_id = p_work_id;
  if v_progress_chapter is not null then
    select position into v_progress_position
    from public.chapters where id = v_progress_chapter;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'work_id', l.work_id,
    'kind', l.kind,
    'title', l.title,
    'summary', l.summary,
    'body', case
      when v_user = v_owner then l.body
      when l.reveal_mode in ('public','spoiler') then l.body
      when l.reveal_mode = 'after_chapter'
        and unlock.status = 'published'
        and unlock.position <= v_progress_position then l.body
      else ''
    end,
    'reveal_mode', l.reveal_mode,
    -- A reader must not learn an unpublished chapter UUID from lore metadata.
    'unlock_chapter_id', case
      when v_user = v_owner then l.unlock_chapter_id
      when unlock.status = 'published' then unlock.id
      else null
    end,
    'unlocked', case
      when v_user = v_owner then true
      when l.reveal_mode in ('public','spoiler') then true
      when l.reveal_mode = 'after_chapter'
        and unlock.status = 'published'
        and unlock.position <= v_progress_position then true
      else false
    end,
    'unlock_chapter', case
      when unlock.id is not null and (v_user = v_owner or unlock.status = 'published')
      then jsonb_build_object('id',unlock.id,'title',unlock.title,'position',unlock.position)
      else null
    end,
    'sort_order', l.sort_order
  ) order by l.kind,l.sort_order,l.title), '[]'::jsonb)
  into v_result
  from public.work_lore_entries l
  join public.works w on w.id = l.work_id
  left join lateral (
    select c.id,c.title,c.position,c.status
    from public.chapters c
    where c.id = l.unlock_chapter_id and c.work_id = l.work_id
  ) unlock on true
  where l.work_id = p_work_id
    and (
      v_user = v_owner
      or (
        w.publication_status = 'published'
        and (
          w.visibility = 'public'
          or (w.visibility = 'members' and v_user is not null)
        )
        and private.member_meets_age(w.minimum_reader_age)
        and l.reveal_mode <> 'private'
      )
    );

  return v_result;
end;
$function$;

-- Synthetic staging cases:
-- Author: private lore and draft-linked unlock chapter title/ID stay visible.
-- Guest: published public lore only, no draft-linked unlock title or ID.
-- Non-owner member: members-only and age rules still apply.
-- After-chapter spoilers unlock only if the referenced chapter is published
-- and the member's own reading progress has reached it.
-- Public/spoiler lore body remains visible where already intended.
-- Unknown work -> [] and no cross-work unlock chapter lookup is possible.
