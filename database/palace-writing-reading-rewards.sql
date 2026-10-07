-- Real writing + reading rewards · lifetime & spendable points, capped daily court credit
-- Existing private.grant_celestial_points deduplicates ledger and updates titles/wallets.
create table public.palace_reading_sessions(
 id uuid primary key default gen_random_uuid(),
 reader_id uuid not null references public.profiles(id) on delete cascade,
 chapter_id uuid not null references public.chapters(id) on delete cascade,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 awarded integer not null default 0 check(awarded in (0,2)),
 unique(reader_id,chapter_id,started_at)
);
create index palace_reading_sessions_reader on public.palace_reading_sessions(reader_id,started_at desc);
alter table public.palace_reading_sessions enable row level security;
revoke all on public.palace_reading_sessions from anon,authenticated;

create or replace function private.palace_writing_reward()
returns trigger language plpgsql security definer set search_path='' as $$
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
 elsif new.revision>old.revision and new.word_count>=old.word_count+150 then
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
end $$;
drop trigger if exists palace_creative_writing_reward on public.chapters;
create trigger palace_creative_writing_reward after insert or update of status,revision,word_count
on public.chapters for each row execute function private.palace_writing_reward();

create or replace function public.begin_palace_reading(p_chapter uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_id uuid;v_author uuid;v_words integer;v_open timestamptz;
begin
 if v_user is null then raise exception 'Sign in to earn reading points.';end if;
 select w.author_id,c.word_count into v_author,v_words
 from public.chapters c join public.works w on w.id=c.work_id
 where c.id=p_chapter and c.status='published'
  and w.publication_status='published' and w.visibility='public';
 if v_author is null or v_author=v_user or v_words<200
 then raise exception 'This chapter is not eligible for reading points.';end if;
 select id into v_id from public.palace_reading_sessions
 where reader_id=v_user and chapter_id=p_chapter and finished_at is null
 and started_at>now()-interval '4 hours' order by started_at desc limit 1;
 if v_id is not null then return v_id;end if;
 insert into public.palace_reading_sessions(reader_id,chapter_id)
 values(v_user,p_chapter) returning id into v_id;
 return v_id;
end $$;

create or replace function public.complete_palace_reading(p_session uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_session record;v_day integer;v_credited integer:=0;v_word_count integer;v_court integer:=0;
begin
 if v_user is null then raise exception 'Sign in to finish a reading session.';end if;
 select * into v_session from public.palace_reading_sessions
 where id=p_session and reader_id=v_user for update;
 if not found then raise exception 'Reading session unavailable.';end if;
 if v_session.finished_at is not null then return jsonb_build_object('awarded',v_session.awarded,'already_completed',true);end if;
 if v_session.started_at>now()-interval '90 seconds' or v_session.started_at<now()-interval '4 hours'
 then raise exception 'Read for at least 90 seconds before collecting reading points.';end if;
 select c.word_count into v_word_count from public.chapters c
 join public.works w on w.id=c.work_id
 where c.id=v_session.chapter_id and c.status='published'
 and w.publication_status='published' and w.visibility='public' and w.author_id<>v_user;
 if v_word_count is null or v_word_count<200 then raise exception 'This chapter is no longer eligible.';end if;
 perform pg_advisory_xact_lock(hashtext(v_user::text),7040411);
 select coalesce(sum(points),0)::integer into v_day from public.celestial_point_ledger
 where user_id=v_user and source_kind='creative_read_complete'
 and (created_at at time zone 'UTC')::date=(now() at time zone 'UTC')::date;
 if v_day<20 then
   v_credited:=private.grant_celestial_points(v_user,2,'legacy',
     'creative_read_complete','creative_read_complete',v_session.chapter_id,null,
     'creative:reading:'||v_user::text||':'||v_session.chapter_id::text);
 end if;
 update public.palace_reading_sessions set finished_at=now(),awarded=v_credited where id=p_session;
 return jsonb_build_object('awarded',v_credited,'already_completed',false,
   'daily_reading_points_before',v_day,'palace_points',0);
end $$;

revoke all on function private.palace_writing_reward() from public,anon,authenticated;
revoke all on function public.begin_palace_reading(uuid) from public,anon;
revoke all on function public.complete_palace_reading(uuid) from public,anon;
grant execute on function public.begin_palace_reading(uuid) to authenticated;
grant execute on function public.complete_palace_reading(uuid) to authenticated;
