-- The Starry Palace — scheduled prose chapter publishing
-- Production database verified on 2026-10-05.
-- Requires pg_cron.

create or replace function private.notify_followers_new_chapter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_work text;
  v_slug text;
  v_f record;
begin
  if not(new.status='published' and old.status is distinct from 'published') then return new; end if;
  select author_id,title,slug into v_author,v_work,v_slug from public.works where id=new.work_id;
  for v_f in select follower_id from public.member_follows where followed_id=v_author
  loop
    perform private.create_notification(
      v_f.follower_id,'story','New work from someone you follow',
      coalesce(v_work,'A story')||' · '||new.title,
      'work',v_slug,'Read chapter',
      'followed-chapter:'||new.id::text||':'||v_f.follower_id::text,
      jsonb_build_object('work_id',new.work_id,'chapter_id',new.id,'author_id',v_author)
    );
  end loop;
  return new;
end;
$$;

create or replace function private.notify_published_chapter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_slug text;
  v_sub record;
begin
  if not (new.status='published' and old.status is distinct from 'published') then return new; end if;
  select title,slug into v_title,v_slug from public.works where id=new.work_id;
  for v_sub in
    select s.user_id from public.story_subscriptions s
    where s.work_id=new.work_id and s.enabled=true
  loop
    perform private.create_notification(
      v_sub.user_id,'story','New chapter · '||coalesce(v_title,'Subscribed work'),
      new.title||' is now published.',
      'work',v_slug,'Read chapter',
      'chapter-published:'||new.id::text||':'||v_sub.user_id::text,
      jsonb_build_object('work_id',new.work_id,'chapter_id',new.id)
    );
  end loop;
  return new;
end;
$$;

create or replace function private.process_scheduled_chapters()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ch record;
  v_now timestamptz;
begin
  for v_ch in
    select ch.id,ch.work_id,ch.title,ch.word_count,w.author_id,w.slug,w.title as work_title,w.first_published_at
    from public.chapters ch
    join public.works w on w.id=ch.work_id
    where ch.status<>'published'
      and ch.scheduled_for is not null
      and ch.scheduled_for<=now()
    order by ch.scheduled_for
    for update of ch skip locked
  loop
    if coalesce(v_ch.word_count,0)<1 or nullif(btrim(coalesce(v_ch.title,'')),'') is null then
      update public.chapters
      set scheduled_for=null,updated_at=now()
      where id=v_ch.id;

      perform private.create_notification(
        v_ch.author_id,
        'writing_schedule',
        'Scheduled chapter release needs attention',
        v_ch.title||' was not published because the chapter is empty or missing a title.',
        'writing',
        v_ch.slug,
        'Open writing desk',
        'writing-schedule-blocked:'||v_ch.id::text||':'||to_char(now(),'YYYY-MM-DD'),
        jsonb_build_object('work_id',v_ch.work_id,'chapter_id',v_ch.id,'work_slug',v_ch.slug,'reason','chapter_not_ready')
      );
      continue;
    end if;

    v_now:=now();

    update public.chapters
    set status='published',
        published_at=v_now,
        scheduled_for=null,
        updated_at=v_now
    where id=v_ch.id;

    update public.works
    set publication_status='published',
        first_published_at=coalesce(first_published_at,v_now),
        last_published_at=v_now,
        updated_at=v_now
    where id=v_ch.work_id;
  end loop;
end;
$$;

revoke all on function private.process_scheduled_chapters() from public;
revoke all on function private.process_scheduled_chapters() from anon;
revoke all on function private.process_scheduled_chapters() from authenticated;

select cron.schedule(
  'palace-scheduled-chapter-publisher',
  '* * * * *',
  $$select private.process_scheduled_chapters();$$
)
where not exists (
  select 1 from cron.job where jobname='palace-scheduled-chapter-publisher'
);
