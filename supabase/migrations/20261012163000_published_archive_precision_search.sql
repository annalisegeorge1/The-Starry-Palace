-- Archive-wide discovery. Only already-published work is searchable.
-- SECURITY INVOKER means RLS remains authoritative for anonymous visitors,
-- authenticated members, tags, chapters and comments. No private draft access.
create or replace function public.search_published_works_v2(
  p_text text default '',
  p_include uuid[] default '{}'::uuid[],
  p_exclude uuid[] default '{}'::uuid[],
  p_rating text default 'all',
  p_status text default 'all',
  p_origin text default 'all',
  p_language text default 'all',
  p_min_words integer default null,
  p_max_words integer default null,
  p_sort text default 'updated',
  p_limit integer default 24,
  p_offset integer default 0
) returns jsonb
language sql stable security invoker
set search_path = ''
as $palace$
with
  args as (
    select
      lower(left(trim(coalesce(p_text,'')),160)) as query,
      coalesce(p_include,'{}'::uuid[])[1:24] as including,
      coalesce(p_exclude,'{}'::uuid[])[1:24] as excluding,
      greatest(1,least(48,coalesce(p_limit,24))) as batch,
      greatest(0,least(100000,coalesce(p_offset,0))) as start
  ),
  eligible as materialized (
    select w.id,w.author_id,w.slug,w.title,w.summary,w.rating,w.language,
           w.work_type,w.completion_status,w.cover_url,w.first_published_at,w.last_published_at,
           p.username as author_username,p.display_name as author_display_name,
           p.avatar_url as author_avatar_url,p.title as author_title
    from public.works w
    left join public.profiles p on p.id=w.author_id
    cross join args a
    where w.publication_status='published'
      and (w.visibility='public' or (w.visibility='members' and auth.uid() is not null))
      and (p_rating is null or p_rating='all' or w.rating=p_rating)
      and (p_status is null or p_status='all' or w.completion_status=p_status)
      and (p_origin is null or p_origin='all'
           or (p_origin='fandom' and w.work_type='fanwork')
           or (p_origin='original' and w.work_type <> 'fanwork'))
      and (p_language is null or p_language='all' or lower(coalesce(w.language,''))=lower(p_language))
      and (
        a.query='' or position(a.query in lower(concat_ws(' ',w.title,w.summary,p.username,p.display_name)))>0
        or exists (
          select 1 from public.work_tags wt
          join public.tags t on t.id=wt.tag_id
          where wt.work_id=w.id and t.status in ('canonical','community')
            and position(a.query in lower(t.name))>0
        )
      )
      and not exists (
        select 1 from unnest(a.including) as needed(id)
        where not exists (
          select 1 from public.work_tags wt
          join public.tags t on t.id=wt.tag_id
          where wt.work_id=w.id and wt.tag_id=needed.id
            and t.status in ('canonical','community')
        )
      )
      and not exists (
        select 1 from public.work_tags wt
        join public.tags t on t.id=wt.tag_id
        where wt.work_id=w.id and wt.tag_id=any(a.excluding)
          and t.status in ('canonical','community')
      )
  ),
  chapter_totals as (
    select c.work_id,count(*)::integer as chapters,
      coalesce(sum(greatest(0,coalesce(c.word_count,0))),0)::bigint as words
    from public.chapters c join eligible e on e.id=c.work_id
    where c.status='published'
    group by c.work_id
  ),
  comment_totals as (
    select c.work_id,count(*)::integer as comments
    from public.comments c join eligible e on e.id=c.work_id
    where c.status='approved'
    group by c.work_id
  ),
  matches as (
    select e.*,coalesce(ch.words,0)::bigint as words,
      coalesce(ch.chapters,0)::integer as chapters,
      coalesce(cm.comments,0)::integer as comments
    from eligible e
    left join chapter_totals ch on ch.work_id=e.id
    left join comment_totals cm on cm.work_id=e.id
    where (p_min_words is null or coalesce(ch.words,0)>=greatest(0,p_min_words))
      and (p_max_words is null or coalesce(ch.words,0)<=greatest(0,p_max_words))
  ),
  page as (
    select m.* from matches m
    order by
      case when p_sort='title' then lower(m.title) end asc nulls last,
      case when p_sort='oldest' then m.first_published_at end asc nulls last,
      case when p_sort='published' then m.first_published_at end desc nulls last,
      case when p_sort='words' then m.words end desc nulls last,
      case when p_sort='chapters' then m.chapters end desc nulls last,
      case when p_sort='comments' then m.comments end desc nulls last,
      case when p_sort not in ('title','oldest','published','words','chapters','comments') then m.last_published_at end desc nulls last,
      m.last_published_at desc nulls last, m.id asc
    limit (select batch from args) offset (select start from args)
  ),
  result_rows as (
    select jsonb_build_object(
      'id',r.id,'author_id',r.author_id,'slug',r.slug,'title',r.title,'summary',r.summary,
      'work_type',r.work_type,'rating',r.rating,'language',r.language,
      'completion_status',r.completion_status,'cover_url',r.cover_url,
      'first_published_at',r.first_published_at,'last_published_at',r.last_published_at,
      'profiles',jsonb_build_object('username',r.author_username,
          'display_name',r.author_display_name,'avatar_url',r.author_avatar_url,'title',r.author_title),
      'reading_stats',jsonb_build_object('words',r.words,'chapters',r.chapters,'comments',r.comments),
      'work_tags',coalesce((
        select jsonb_agg(jsonb_build_object(
          'tag_id',wt.tag_id,
          'tags',jsonb_build_object('id',t.id,'name',t.name,'category',t.category,'status',t.status)
        ) order by wt.position)
        from public.work_tags wt join public.tags t on t.id=wt.tag_id
        where wt.work_id=r.id and t.status in ('canonical','community')
      ),'[]'::jsonb)
    ) as item,
    row_number() over (
      order by
        case when p_sort='title' then lower(r.title) end asc nulls last,
        case when p_sort='oldest' then r.first_published_at end asc nulls last,
        case when p_sort='published' then r.first_published_at end desc nulls last,
        case when p_sort='words' then r.words end desc nulls last,
        case when p_sort='chapters' then r.chapters end desc nulls last,
        case when p_sort='comments' then r.comments end desc nulls last,
        case when p_sort not in ('title','oldest','published','words','chapters','comments') then r.last_published_at end desc nulls last,
        r.last_published_at desc nulls last,r.id asc
    ) as pos
    from page r
  )
  select jsonb_build_object(
    'total', (select count(*) from matches),
    'results',coalesce((select jsonb_agg(item order by pos) from result_rows),'[]'::jsonb),
    'limit',(select batch from args),
    'offset',(select start from args)
  )
$palace$;
revoke all on function public.search_published_works_v2(text,uuid[],uuid[],text,text,text,text,integer,integer,text,integer,integer) from public;
grant execute on function public.search_published_works_v2(text,uuid[],uuid[],text,text,text,text,integer,integer,text,integer,integer) to anon,authenticated;
comment on function public.search_published_works_v2(text,uuid[],uuid[],text,text,text,text,integer,integer,text,integer,integer) is 'Full-archive published work search with precise tag inclusion, exclusion, word ranges and exact total; RLS-enforced.';
