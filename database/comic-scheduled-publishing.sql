-- The Starry Palace — scheduled comic publishing
-- Production database verified on 2026-10-05.
-- Requires pg_cron (enabled by comic-notification-cadence.sql).

create or replace function private.process_scheduled_comic_episodes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ep record;
  v_page_count integer;
  v_missing integer;
  v_now timestamptz;
begin
  for v_ep in
    select e.id,e.comic_id,e.title,c.creator_id,c.title as comic_title,c.first_published_at
    from public.comic_episodes e
    join public.comics c on c.id=e.comic_id
    where e.status<>'published'
      and e.scheduled_for is not null
      and e.scheduled_for<=now()
      and c.publication_status<>'archived'
    order by e.scheduled_for
    for update of e skip locked
  loop
    select count(*),
           count(*) filter(where not p.decorative and nullif(btrim(coalesce(p.alt_text,'')),'') is null)
      into v_page_count,v_missing
    from public.comic_pages p
    where p.episode_id=v_ep.id;

    if coalesce(v_page_count,0)=0 or coalesce(v_missing,0)>0 then
      update public.comic_episodes
      set scheduled_for=null,updated_at=now()
      where id=v_ep.id;

      perform private.create_notification(
        v_ep.creator_id,
        'comic_schedule',
        'Scheduled comic release needs attention',
        case when coalesce(v_page_count,0)=0
          then v_ep.title||' was not published because it has no comic pages.'
          else v_ep.title||' was not published because one or more pages need image descriptions.'
        end,
        'comic_studio',
        null,
        'Open Comic Studio',
        'comic-schedule-blocked:'||v_ep.id::text||':'||to_char(now(),'YYYY-MM-DD'),
        jsonb_build_object(
          'comic_id',v_ep.comic_id,
          'episode_id',v_ep.id,
          'reason',case when coalesce(v_page_count,0)=0 then 'no_pages' else 'missing_descriptions' end
        )
      );
      continue;
    end if;

    v_now:=now();

    update public.comic_episodes
    set status='published',
        published_at=v_now,
        scheduled_for=null,
        updated_at=v_now
    where id=v_ep.id;

    update public.comics
    set publication_status='published',
        first_published_at=coalesce(first_published_at,v_now),
        last_published_at=v_now,
        updated_at=v_now
    where id=v_ep.comic_id;
  end loop;
end;
$$;

revoke all on function private.process_scheduled_comic_episodes() from public;
revoke all on function private.process_scheduled_comic_episodes() from anon;
revoke all on function private.process_scheduled_comic_episodes() from authenticated;

select cron.schedule(
  'palace-scheduled-comic-publisher',
  '* * * * *',
  $$select private.process_scheduled_comic_episodes();$$
)
where not exists (
  select 1 from cron.job where jobname='palace-scheduled-comic-publisher'
);
