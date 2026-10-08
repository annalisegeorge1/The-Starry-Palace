-- Restore fair creative credits when the frontend publishes the chapter
-- before changing its parent work publication_status.
-- All credits use private.grant_celestial_points for dedupe and account updates.
-- The existing 60-per-UTC-day creative cap is enforced per author.
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
 elsif new.word_count>=old.word_count+150 then
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

create or replace function private.credit_visible_published_chapters(p_work uuid)
returns integer language plpgsql security definer set search_path='' as $credit$
declare v_author uuid;v_day integer;v_chapter record;v_awarded integer:=0;v_delta integer;
begin
 select author_id into v_author from public.works
 where id=p_work and publication_status='published' and visibility='public';
 if v_author is null then return 0;end if;
 perform pg_advisory_xact_lock(hashtext(v_author::text),7040410);
 select coalesce(sum(points),0)::integer into v_day
 from public.celestial_point_ledger where user_id=v_author
 and source_kind in ('creative_chapter_publish','creative_chapter_revision')
 and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 for v_chapter in
  select c.id from public.chapters c where c.work_id=p_work
   and c.status='published' and c.word_count>=150
   and not exists(select 1 from public.celestial_point_ledger l
    where l.dedupe_key='creative:publish:'||c.id::text)
   order by c.published_at nulls last,c.created_at,c.id
 loop
  exit when v_day>=60;
  v_delta:=private.grant_celestial_points(
   v_author,least(20,60-v_day),'participation',
   'creative_chapter_publish','creative_chapter_publish',v_chapter.id,null,
   'creative:publish:'||v_chapter.id::text
  );
  v_day:=v_day+v_delta;
  v_awarded:=v_awarded+v_delta;
 end loop;
 return v_awarded;
end $credit$;
revoke all on function private.credit_visible_published_chapters(uuid) from public,anon,authenticated;

create or replace function private.reward_when_work_becomes_public()
returns trigger language plpgsql security definer set search_path='' as $work$
begin
 if new.publication_status='published' and new.visibility='public'
    and (old.publication_status is distinct from new.publication_status
      or old.visibility is distinct from new.visibility)
 then perform private.credit_visible_published_chapters(new.id);end if;
 return new;
end $work$;
revoke all on function private.reward_when_work_becomes_public() from public,anon,authenticated;
drop trigger if exists palace_work_publication_reward on public.works;
create trigger palace_work_publication_reward
after update of publication_status,visibility on public.works
for each row execute function private.reward_when_work_becomes_public();

-- Reconcile eligible previously published chapters once. Does not alter stories,
-- publication dates, balances directly, or existing ledger rows.
do $backfill$ declare w record;begin
 for w in select id from public.works
 where publication_status='published' and visibility='public'
 order by first_published_at nulls last,id
 loop perform private.credit_visible_published_chapters(w.id);end loop;
end $backfill$;
