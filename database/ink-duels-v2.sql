-- Ink Duels v2
-- Timed formats, blind voting window, reveal phase, Prompt Orrery family metadata,
-- host cancellation, and indexes for the active duel feed.

alter table public.micro_duels
  add column if not exists writing_minutes integer not null default 15,
  add column if not exists voting_minutes integer not null default 720,
  add column if not exists voting_closes_at timestamptz not null default (now() + interval '12 hours 15 minutes'),
  add column if not exists duel_mode text not null default 'classic',
  add column if not exists prompt_family text not null default 'Open';

update public.micro_duels
set
  writing_minutes = greatest(1, round(extract(epoch from (closes_at-starts_at))/60.0)::int),
  voting_minutes = 720,
  voting_closes_at = closes_at + interval '12 hours'
where voting_closes_at is null
   or voting_closes_at <= closes_at;

alter table public.micro_duels
  drop constraint if exists micro_duels_writing_minutes_check,
  add constraint micro_duels_writing_minutes_check check (writing_minutes between 5 and 45),
  drop constraint if exists micro_duels_voting_minutes_check,
  add constraint micro_duels_voting_minutes_check check (voting_minutes between 60 and 1440),
  drop constraint if exists micro_duels_duel_mode_check,
  add constraint micro_duels_duel_mode_check check (duel_mode in ('flash','classic','deep')),
  drop constraint if exists micro_duels_prompt_family_check,
  add constraint micro_duels_prompt_family_check check (char_length(prompt_family) between 1 and 80);

create or replace function public.create_micro_duel_v2(
  p_title text,
  p_prompt text,
  p_word_limit integer default 500,
  p_writing_minutes integer default 15,
  p_voting_minutes integer default 720,
  p_duel_mode text default 'classic',
  p_prompt_family text default 'Open'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_title text := btrim(coalesce(p_title,''));
  v_prompt text := btrim(coalesce(p_prompt,''));
  v_limit integer := greatest(100,least(coalesce(p_word_limit,500),1200));
  v_write integer := greatest(5,least(coalesce(p_writing_minutes,15),45));
  v_vote integer := greatest(60,least(coalesce(p_voting_minutes,720),1440));
  v_mode text := lower(btrim(coalesce(p_duel_mode,'classic')));
  v_family text := left(btrim(coalesce(p_prompt_family,'Open')),80);
  v_start timestamptz := now();
  v_close timestamptz;
begin
  if v_user is null then raise exception 'Sign in to open an Ink Duel.'; end if;
  if v_title='' or char_length(v_title)>100 then raise exception 'Give the duel a title under 100 characters.'; end if;
  if v_prompt='' or char_length(v_prompt)>500 then raise exception 'Give the duel a prompt under 500 characters.'; end if;
  if v_mode not in ('flash','classic','deep') then v_mode:='classic'; end if;
  if v_family='' then v_family:='Open'; end if;

  v_close := v_start + make_interval(mins=>v_write);

  insert into public.micro_duels(
    host_id,title,prompt,word_limit,starts_at,closes_at,status,
    writing_minutes,voting_minutes,voting_closes_at,duel_mode,prompt_family
  )
  values(
    v_user,v_title,v_prompt,v_limit,v_start,v_close,'open',
    v_write,v_vote,v_close+make_interval(mins=>v_vote),v_mode,v_family
  )
  returning id into v_id;

  return v_id;
end
$function$;

create or replace function public.get_micro_duels()
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null then raise exception 'Sign in to enter the Duel Gallery.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',d.id,
    'host_id',d.host_id,
    'is_host',(d.host_id=v_user),
    'title',d.title,
    'prompt',d.prompt,
    'word_limit',d.word_limit,
    'writing_minutes',d.writing_minutes,
    'voting_minutes',d.voting_minutes,
    'duel_mode',d.duel_mode,
    'prompt_family',d.prompt_family,
    'starts_at',d.starts_at,
    'closes_at',d.closes_at,
    'voting_closes_at',d.voting_closes_at,
    'status',d.status,
    'phase',case
      when d.status='cancelled' then 'cancelled'
      when now()<d.closes_at then 'writing'
      when now()<d.voting_closes_at then 'voting'
      else 'results'
    end,
    'entry_count',(select count(*) from public.micro_duel_entries e where e.duel_id=d.id),
    'vote_count',(select count(*) from public.micro_duel_votes v where v.duel_id=d.id),
    'my_entry',(select jsonb_build_object(
      'id',e.id,'body',e.body,'word_count',e.word_count,'submitted_at',e.submitted_at
    ) from public.micro_duel_entries e where e.duel_id=d.id and e.user_id=v_user),
    'my_vote',(select v.entry_id from public.micro_duel_votes v where v.duel_id=d.id and v.voter_id=v_user),
    'entries',case when now()>=d.closes_at then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,
        'body',e.body,
        'word_count',e.word_count,
        'is_mine',(e.user_id=v_user),
        'votes',case when now()>=d.voting_closes_at
          then (select count(*) from public.micro_duel_votes v where v.entry_id=e.id)
          else null end,
        'winner',case when now()>=d.voting_closes_at
          then (
            (select count(*) from public.micro_duel_votes v where v.entry_id=e.id)>0
            and (select count(*) from public.micro_duel_votes v where v.entry_id=e.id)=coalesce((
              select max(vote_total) from (
                select count(v2.voter_id)::int as vote_total
                from public.micro_duel_entries e2
                left join public.micro_duel_votes v2 on v2.entry_id=e2.id
                where e2.duel_id=d.id
                group by e2.id
              ) scores
            ),0)
          )
          else false end,
        'author',case when now()>=d.voting_closes_at then (
          select jsonb_build_object(
            'id',p.id,'username',p.username,'display_name',p.display_name,'title',p.title,'avatar_url',p.avatar_url
          )
          from public.profiles p where p.id=e.user_id
        ) else null end
      )
      order by
        case when now()>=d.voting_closes_at then
          (select count(*) from public.micro_duel_votes v where v.entry_id=e.id)
        else null end desc nulls last,
        case when now()<d.voting_closes_at then md5(e.id::text||d.id::text) else null end,
        e.submitted_at
      )
      from public.micro_duel_entries e
      where e.duel_id=d.id
    ),'[]'::jsonb) else '[]'::jsonb end
  ) order by
    case when now()<d.voting_closes_at then 0 else 1 end,
    d.created_at desc
  ),'[]'::jsonb)
  into v_result
  from public.micro_duels d
  where d.status<>'cancelled'
    and d.created_at>=now()-interval '30 days';

  return v_result;
end
$function$;

create or replace function public.submit_micro_duel_entry(p_duel_id uuid,p_body text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
  v_duel public.micro_duels%rowtype;
  v_body text := btrim(coalesce(p_body,''));
  v_words integer;
  v_entry uuid;
  v_today integer := 0;
  v_points integer := 0;
begin
  if v_user is null then raise exception 'Sign in to enter the Ink Duel.'; end if;
  select * into v_duel from public.micro_duels where id=p_duel_id;
  if v_duel.id is null or v_duel.status<>'open' then raise exception 'This Ink Duel is unavailable.'; end if;
  if now()>=v_duel.closes_at then raise exception 'The writing window has closed.'; end if;
  if v_body='' then raise exception 'Write your micro-fiction before submitting.'; end if;

  select count(*)::int into v_words
  from regexp_split_to_table(v_body,'\s+') w
  where btrim(w)<>'';

  if v_words>v_duel.word_limit then
    raise exception 'This entry is % words. The duel limit is %.',v_words,v_duel.word_limit;
  end if;

  insert into public.micro_duel_entries(duel_id,user_id,body,word_count)
  values(p_duel_id,v_user,v_body,v_words)
  on conflict(duel_id,user_id) do update
    set body=excluded.body,word_count=excluded.word_count,submitted_at=now()
  returning id into v_entry;

  select coalesce(sum(points),0)::int into v_today
  from public.celestial_point_ledger
  where user_id=v_user
    and reason='micro_duel_completed'
    and created_at>=date_trunc('day',now());

  if v_today<12 then
    v_points:=private.grant_celestial_points(
      v_user,least(4,12-v_today),'participation','micro_duel_completed',
      'micro_duel_entry',v_entry,null,'micro-duel:'||v_entry
    );
  end if;

  return jsonb_build_object(
    'entry_id',v_entry,
    'word_count',v_words,
    'celestial_points_awarded',v_points
  );
end
$function$;

create or replace function public.vote_micro_duel(p_duel_id uuid,p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_closes timestamptz;
  v_vote_closes timestamptz;
begin
  if v_user is null then raise exception 'Sign in to vote in the blind gallery.'; end if;

  select closes_at,voting_closes_at into v_closes,v_vote_closes
  from public.micro_duels
  where id=p_duel_id and status='open';

  if v_closes is null then raise exception 'This Ink Duel is unavailable.'; end if;
  if now()<v_closes then raise exception 'Blind voting opens when the writing window closes.'; end if;
  if now()>=v_vote_closes then raise exception 'Blind voting has closed. The reveal is open.'; end if;

  select user_id into v_owner
  from public.micro_duel_entries
  where id=p_entry_id and duel_id=p_duel_id;

  if v_owner is null then raise exception 'That entry is not in this duel.'; end if;
  if v_owner=v_user then raise exception 'Writers cannot vote for their own entry.'; end if;

  insert into public.micro_duel_votes(duel_id,voter_id,entry_id)
  values(p_duel_id,v_user,p_entry_id)
  on conflict(duel_id,voter_id) do update
    set entry_id=excluded.entry_id,created_at=now();

  return jsonb_build_object('duel_id',p_duel_id,'entry_id',p_entry_id);
end
$function$;

create or replace function public.cancel_micro_duel(p_duel_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in to manage your Ink Duel.'; end if;

  update public.micro_duels
  set status='cancelled'
  where id=p_duel_id
    and host_id=v_user
    and status='open';

  if not found then
    raise exception 'Only the host can close an open Ink Duel.';
  end if;

  return true;
end
$function$;

revoke all on function public.create_micro_duel_v2(text,text,integer,integer,integer,text,text) from public, anon;
revoke all on function public.cancel_micro_duel(uuid) from public, anon;
grant execute on function public.create_micro_duel_v2(text,text,integer,integer,integer,text,text) to authenticated;
grant execute on function public.cancel_micro_duel(uuid) to authenticated;
grant execute on function public.get_micro_duels() to authenticated;
grant execute on function public.submit_micro_duel_entry(uuid,text) to authenticated;
grant execute on function public.vote_micro_duel(uuid,uuid) to authenticated;

create index if not exists micro_duels_host_id_idx on public.micro_duels(host_id);
create index if not exists micro_duel_entries_user_id_idx on public.micro_duel_entries(user_id);
create index if not exists micro_duel_votes_voter_id_idx on public.micro_duel_votes(voter_id);
create index if not exists micro_duels_active_phase_idx on public.micro_duels(status,closes_at,voting_closes_at);
