-- The Starry Palace — comic notification cadence
-- Keeps immediate followers immediate while weekly followers receive one digest.
-- Production database verified on 2026-10-05.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.notify_published_comic_episode()
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
  if not (new.status='published' and old.status is distinct from 'published') then
    return new;
  end if;

  select title, slug into v_title, v_slug
  from public.comics
  where id=new.comic_id;

  for v_sub in
    select s.user_id
    from public.comic_subscriptions s
    where s.comic_id=new.comic_id
      and s.enabled=true
      and s.frequency='immediate'
  loop
    perform private.create_notification(
      v_sub.user_id,
      'comic',
      'New comic episode · '||coalesce(v_title,'Subscribed comic'),
      new.title||' is now published.',
      'comic',
      v_slug,
      'Read episode',
      'comic-episode-published:'||new.id::text||':'||v_sub.user_id::text,
      jsonb_build_object('comic_id',new.comic_id,'episode_id',new.id)
    );
  end loop;

  return new;
end;
$$;

create or replace function private.send_weekly_comic_digest()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user record;
  v_count integer;
  v_comics integer;
  v_week text := to_char((now() at time zone 'UTC')::date, 'IYYY-IW');
begin
  for v_user in
    select distinct s.user_id
    from public.comic_subscriptions s
    where s.enabled=true and s.frequency='weekly'
  loop
    select
      count(distinct e.id),
      count(distinct e.comic_id)
    into v_count, v_comics
    from public.comic_subscriptions s
    join public.comic_episodes e on e.comic_id=s.comic_id
    where s.user_id=v_user.user_id
      and s.enabled=true
      and s.frequency='weekly'
      and e.status='published'
      and e.published_at >= date_trunc('week', now());

    if coalesce(v_count,0)>0 then
      perform private.create_notification(
        v_user.user_id,
        'comic_digest',
        'Your weekly comic digest',
        v_count||' new episode'||case when v_count=1 then '' else 's' end||
        ' across '||v_comics||' comic'||case when v_comics=1 then '' else 's' end||
        ' are waiting for you.',
        'library',
        null,
        'Open subscriptions',
        'comic-weekly-digest:'||v_week||':'||v_user.user_id::text,
        jsonb_build_object('tab','following','episode_count',v_count,'comic_count',v_comics)
      );
    end if;
  end loop;
end;
$$;

revoke all on function private.send_weekly_comic_digest() from public;
revoke all on function private.send_weekly_comic_digest() from anon;
revoke all on function private.send_weekly_comic_digest() from authenticated;

select cron.schedule(
  'palace-weekly-comic-digest',
  '0 12 * * 0',
  $$select private.send_weekly_comic_digest();$$
)
where not exists (
  select 1 from cron.job where jobname='palace-weekly-comic-digest'
);
