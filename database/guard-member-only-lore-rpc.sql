-- Fix a cross-policy authorization mismatch in the lore reader.
-- Normal works SELECT policy requires auth.uid() for visibility='members',
-- but the SECURITY DEFINER lore RPC bypasses works RLS. Keep the author,
-- public, members-only, private-lore and chapter-spoiler behavior otherwise unchanged.
-- Idempotent: CREATE OR REPLACE keeps existing function ownership/grants.
CREATE OR REPLACE FUNCTION public.get_work_lore(p_work_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_visible boolean;
  v_progress_chapter uuid;
  v_progress_position integer := 0;
  v_result jsonb;
begin
  select author_id into v_owner from public.works where id=p_work_id;
  if v_owner is null then return '[]'::jsonb; end if;

  select rp.chapter_id into v_progress_chapter
  from public.reading_progress rp
  where rp.user_id=v_user and rp.work_id=p_work_id;

  if v_progress_chapter is not null then
    select position into v_progress_position from public.chapters where id=v_progress_chapter;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',l.id,
    'work_id',l.work_id,
    'kind',l.kind,
    'title',l.title,
    'summary',l.summary,
    'body',case
      when v_user=v_owner then l.body
      when l.reveal_mode='public' then l.body
      when l.reveal_mode='spoiler' then l.body
      when l.reveal_mode='after_chapter'
        and coalesce((select position from public.chapters where id=l.unlock_chapter_id),999999)<=v_progress_position then l.body
      else ''
    end,
    'reveal_mode',l.reveal_mode,
    'unlock_chapter_id',l.unlock_chapter_id,
    'unlocked',case
      when v_user=v_owner then true
      when l.reveal_mode in ('public','spoiler') then true
      when l.reveal_mode='after_chapter'
        and coalesce((select position from public.chapters where id=l.unlock_chapter_id),999999)<=v_progress_position then true
      else false
    end,
    'unlock_chapter',(
      select jsonb_build_object('id',c.id,'title',c.title,'position',c.position)
      from public.chapters c where c.id=l.unlock_chapter_id
    ),
    'sort_order',l.sort_order
  ) order by l.kind,l.sort_order,l.title),'[]'::jsonb)
  into v_result
  from public.work_lore_entries l
  join public.works w on w.id=l.work_id
  where l.work_id=p_work_id
    and (
      v_user=v_owner
      or (
        w.publication_status='published'
        and (w.visibility='public' or (w.visibility='members' and v_user is not null))
        and l.reveal_mode<>'private'
      )
    );

  return v_result;
end
$function$;
