-- Palace point integrity: do not change or reset existing point balances.
-- Existing daily caps, per-source dedupe keys and ledger remain unchanged.
-- Recalculate only awards for future qualifying actions.
-- palace_writing_reward
CREATE OR REPLACE FUNCTION private.palace_writing_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_author uuid;v_changed integer;v_amount integer;v_kind text;v_last timestamptz;v_day integer;v_quarter date;
begin
 select author_id into v_author from public.works where id=new.work_id;
 if v_author is null then return new; end if;
 -- Only substantial PUBLIC publications by the author receive rewards;
 -- collaborators cannot multiply payouts by editing an author's chapters.
 if new.status<>'published' or new.word_count<150 then return new; end if;
 if tg_op='INSERT' then
   -- Scheduled work appears as an INSERT only when status is published.
   v_kind:='publish';v_amount:=20;
 elsif old.status<>'published' then
   v_kind:='publish';v_amount:=20;
 elsif new.body_html is distinct from old.body_html
      and new.word_count>=old.word_count+150 then
   v_kind:='revision';v_amount:=10;
 else return new; end if;
 if not exists(select 1 from public.works
    where id=new.work_id and publication_status='published' and visibility='public')
 then return new; end if;
 perform pg_advisory_xact_lock(hashtext(v_author::text),7040410);
 select coalesce(sum(points),0)::integer into v_day
 from public.celestial_point_ledger where user_id=v_author and source_kind in ('creative_chapter_publish','creative_chapter_revision')
 and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_day>=60 then return new;end if;
 v_amount:=least(v_amount,60-v_day);
 if v_kind='publish' then
   perform private.grant_celestial_points(v_author,v_amount,'participation',
     'creative_chapter_publish','creative_chapter_publish',new.id,null,
     'creative:publish:'||new.id::text);
 else
   select max(created_at) into v_last from public.celestial_point_ledger
    where user_id=v_author and source_id=new.id and source_kind='creative_chapter_revision';
   if v_last>now()-interval '24 hours' then return new;end if;
   perform private.grant_celestial_points(v_author,v_amount,'participation',
     'creative_chapter_revision','creative_chapter_revision',new.id,null,
     'creative:revision:'||new.id::text||':'||(now() at time zone 'UTC')::date::text);
 end if;
 return new;
end $function$;

-- award_approved_comment_points
CREATE OR REPLACE FUNCTION private.award_approved_comment_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_author uuid;
  v_commenter_today integer := 0;
  v_writer_today integer := 0;
begin
  if new.status<>'approved' or (tg_op='UPDATE' and old.status='approved') then return new; end if;
  if char_length(btrim(coalesce(new.body,''))) < 20 then return new; end if;

  select author_id into v_author from public.works where id=new.work_id;
  if v_author is null then return new; end if;
  -- No awards for praising your own work or for private/unpublished work.
  if v_author = new.author_id then return new; end if;
  if not exists (
    select 1 from public.works w where w.id=new.work_id
      and w.publication_status='published' and w.visibility='public'
  ) then return new; end if;

  select coalesce(sum(points),0)::int into v_commenter_today
  from public.celestial_point_ledger
  where user_id=new.author_id and reason='thoughtful_comment'
    and created_at>=date_trunc('day',now());

  if v_commenter_today < 10 then
    perform private.grant_celestial_points(
      new.author_id,least(2,10-v_commenter_today),'participation','thoughtful_comment',
      'comment',new.id,v_author,'comment:'||new.id||':writer'
    );
  end if;

  if v_author<>new.author_id then
    select coalesce(sum(points),0)::int into v_writer_today
    from public.celestial_point_ledger
    where user_id=v_author and reason='reader_response_received'
      and created_at>=date_trunc('day',now());

    if v_writer_today < 15 then
      perform private.grant_celestial_points(
        v_author,1,'receiving','reader_response_received',
        'comment',new.id,new.author_id,'comment:'||new.id||':creator'
      );
    end if;
  end if;

  return new;
end
$function$;
