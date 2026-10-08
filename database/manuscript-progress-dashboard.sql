-- Manuscript progress planning: private metadata only; does not modify or publish chapters.
create table if not exists public.manuscript_story_goals(
  work_id uuid primary key references public.works(id) on delete cascade,
  target_words integer not null default 0 check(target_words between 0 and 5000000),
  target_chapters integer not null default 0 check(target_chapters between 0 and 2000),
  target_date date,
  intention text not null default '' check(char_length(intention) <= 280),
  updated_at timestamptz not null default now()
);
create table if not exists public.manuscript_chapter_plans(
  chapter_id uuid primary key references public.chapters(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  stage text not null default 'drafting'
    check(stage in ('idea','drafting','revising','proofreading','ready')),
  target_words integer not null default 0 check(target_words between 0 and 200000),
  revision_goal text not null default '' check(char_length(revision_goal) <= 280),
  target_date date,
  updated_at timestamptz not null default now()
);
create index if not exists manuscript_chapter_plans_work_idx on public.manuscript_chapter_plans(work_id);
alter table public.manuscript_story_goals enable row level security;
alter table public.manuscript_chapter_plans enable row level security;
revoke all on public.manuscript_story_goals,public.manuscript_chapter_plans from public,anon,authenticated;

-- Owner-only RPCs: chapter editorial stages are independent of published/scheduled status.
create or replace function public.get_manuscript_progress(p_work uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_goal jsonb;v_plans jsonb;
begin
 if v_user is null or not exists(select 1 from public.works where id=p_work and author_id=v_user)
 then raise exception 'Only the owner can view private manuscript planning.';end if;
 select jsonb_build_object('target_words',g.target_words,'target_chapters',g.target_chapters,
 'target_date',g.target_date,'intention',g.intention,'updated_at',g.updated_at)
 into v_goal from public.manuscript_story_goals g where g.work_id=p_work;
 select coalesce(jsonb_agg(jsonb_build_object(
  'chapter_id',p.chapter_id,'stage',p.stage,'target_words',p.target_words,
  'target_date',p.target_date,'revision_goal',p.revision_goal,'updated_at',p.updated_at)
  order by ch.position,ch.id),'[]'::jsonb)
 into v_plans from public.manuscript_chapter_plans p
 join public.chapters ch on ch.id=p.chapter_id and ch.work_id=p.work_id
 where p.work_id=p_work;
 return jsonb_build_object('goal',coalesce(v_goal,jsonb_build_object(
  'target_words',0,'target_chapters',0,'target_date',null,'intention','')),
  'chapters',v_plans);
end $$;

create or replace function public.save_manuscript_story_goal(
 p_work uuid,p_words integer,p_chapters integer,p_date date,p_intention text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not exists(select 1 from public.works where id=p_work and author_id=v_user)
 then raise exception 'Only the owner can set manuscript goals.';end if;
 if p_words is null or p_words not between 0 and 5000000
 or p_chapters is null or p_chapters not between 0 and 2000
 or char_length(coalesce(p_intention,''))>280
 then raise exception 'Check manuscript targets and keep the intention under 280 characters.';end if;
 insert into public.manuscript_story_goals(work_id,target_words,target_chapters,target_date,intention,updated_at)
 values(p_work,p_words,p_chapters,p_date,coalesce(btrim(p_intention),''),now())
 on conflict(work_id) do update set target_words=excluded.target_words,
 target_chapters=excluded.target_chapters,target_date=excluded.target_date,
 intention=excluded.intention,updated_at=now();
 return public.get_manuscript_progress(p_work);
end $$;

create or replace function public.save_manuscript_chapter_plan(
 p_chapter uuid,p_stage text,p_words integer,p_revision_goal text,p_date date
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_work uuid;
begin
 select ch.work_id into v_work from public.chapters ch
 join public.works w on w.id=ch.work_id and w.author_id=v_user
 where ch.id=p_chapter;
 if v_user is null or v_work is null then
 raise exception 'You may only plan a chapter in your own manuscript.';end if;
 if p_stage is null or p_stage not in ('idea','drafting','revising','proofreading','ready')
 or p_words is null or p_words not between 0 and 200000
 or char_length(coalesce(p_revision_goal,''))>280
 then raise exception 'Check the editing stage, word target, or revision goal.';end if;
 insert into public.manuscript_chapter_plans(chapter_id,work_id,stage,target_words,revision_goal,target_date,updated_at)
 values(p_chapter,v_work,p_stage,p_words,coalesce(btrim(p_revision_goal),''),p_date,now())
 on conflict(chapter_id) do update set stage=excluded.stage,target_words=excluded.target_words,
 revision_goal=excluded.revision_goal,target_date=excluded.target_date,updated_at=now();
 return public.get_manuscript_progress(v_work);
end $$;

revoke all on function public.get_manuscript_progress(uuid) from public,anon;
revoke all on function public.save_manuscript_story_goal(uuid,integer,integer,date,text) from public,anon;
revoke all on function public.save_manuscript_chapter_plan(uuid,text,integer,text,date) from public,anon;
grant execute on function public.get_manuscript_progress(uuid) to authenticated;
grant execute on function public.save_manuscript_story_goal(uuid,integer,integer,date,text) to authenticated;
grant execute on function public.save_manuscript_chapter_plan(uuid,text,integer,text,date) to authenticated;
