-- THE STARRY PALACE — REVIEW CANDIDATE ONLY. NOT APPLIED TO PRODUCTION.
-- Public tag statistics must not count unpublished, private, age-inaccessible
-- stories or comics. These aggregates are discovery metadata, not internal
-- author statistics. Keep all names/statuses, fuzzy matching, ordering and
-- result shapes unchanged. Counts may legitimately differ by signed-in age.
-- Staging checks required before any production rollout.

create or replace function public.search_palace_tags(
  p_query text default ''::text,
  p_category text default null::text,
  p_limit integer default 80
)
returns table(id uuid, name text, category text, status text, usage_count bigint)
language sql
security definer
set search_path to ''
as $function$
 select t.id,t.name,t.category,t.status,
        (
          select count(*)
          from public.work_tags wt join public.works w on w.id=wt.work_id
          where wt.tag_id=t.id
            and w.publication_status='published'
            and (w.visibility='public'
                 or (w.visibility='members' and (select auth.uid()) is not null))
            and private.member_meets_age(w.minimum_reader_age)
        )
        +(
          select count(*)
          from public.comic_tags ct join public.comics c on c.id=ct.comic_id
          where ct.tag_id=t.id
            and c.publication_status='published'
            and (c.visibility='public'
                 or (c.visibility='members' and (select auth.uid()) is not null))
            and private.member_meets_age(c.minimum_reader_age)
        ) as usage_count
 from public.tags t
 where t.status in ('canonical','community')
   and (coalesce(btrim(p_query),'')='' or t.name ilike '%'||btrim(p_query)||'%')
   and (p_category is null or p_category='' or p_category='all' or t.category=p_category)
 order by
   case when lower(t.name)=lower(coalesce(btrim(p_query),'')) then 0
        when lower(t.name) like lower(coalesce(btrim(p_query),''))||'%' then 1
        else 2 end,
   usage_count desc,
   t.name
 limit greatest(1,least(coalesce(p_limit,80),200))
$function$;


create or replace function public.search_palace_tags_v2(
  p_query text default ''::text,
  p_category text default null::text,
  p_limit integer default 80
)
returns table(id uuid, name text, category text, status text,
              usage_count bigint, match_score double precision)
language sql
security definer
set search_path to ''
as $function$
 with base as (
    select
      t.id,
      t.name,
      t.category,
      t.status,
      (
        (
          select count(*) from public.work_tags wt
          join public.works w on w.id=wt.work_id
          where wt.tag_id=t.id
            and w.publication_status='published'
            and (w.visibility='public'
                 or (w.visibility='members' and (select auth.uid()) is not null))
            and private.member_meets_age(w.minimum_reader_age)
        )
        +(
          select count(*) from public.comic_tags ct
          join public.comics c on c.id=ct.comic_id
          where ct.tag_id=t.id
            and c.publication_status='published'
            and (c.visibility='public'
                 or (c.visibility='members' and (select auth.uid()) is not null))
            and private.member_meets_age(c.minimum_reader_age)
        )
      )::bigint as usage_count,
      case
        when coalesce(btrim(p_query),'')='' then 0::double precision
        when lower(t.name)=lower(btrim(p_query)) then 100
        when lower(t.name) like lower(btrim(p_query))||'%' then 80
        when lower(t.name) like '%'||lower(btrim(p_query))||'%' then 60
        else extensions.similarity(lower(t.name),lower(btrim(p_query)))*50
      end::double precision as match_score
    from public.tags t
    where t.status in ('canonical','community')
      and (p_category is null or p_category='' or p_category='all' or t.category=p_category)
      and (
        coalesce(btrim(p_query),'')=''
        or t.name ilike '%'||btrim(p_query)||'%'
        or extensions.similarity(lower(t.name),lower(btrim(p_query))) >= .18
      )
  )
  select b.id,b.name,b.category,b.status,b.usage_count,b.match_score
  from base b
  order by
    case when coalesce(btrim(p_query),'')='' then 0 else 1 end,
    b.match_score desc,
    b.usage_count desc,
    b.name
  limit greatest(1,least(coalesce(p_limit,80),250))
$function$;


create or replace function public.get_tag_family_counts()
returns table(category text,total_count bigint,canonical_count bigint,
              community_count bigint,used_count bigint)
language sql
security definer
set search_path to ''
as $function$
 select t.category,
        count(*)::bigint as total_count,
        count(*) filter (where t.status='canonical')::bigint as canonical_count,
        count(*) filter (where t.status='community')::bigint as community_count,
        count(*) filter (
          where exists (
            select 1 from public.work_tags wt
            join public.works w on w.id=wt.work_id
            where wt.tag_id=t.id
              and w.publication_status='published'
              and (w.visibility='public'
                   or (w.visibility='members' and (select auth.uid()) is not null))
              and private.member_meets_age(w.minimum_reader_age)
          )
          or exists (
            select 1 from public.comic_tags ct
            join public.comics c on c.id=ct.comic_id
            where ct.tag_id=t.id
              and c.publication_status='published'
              and (c.visibility='public'
                   or (c.visibility='members' and (select auth.uid()) is not null))
              and private.member_meets_age(c.minimum_reader_age)
          )
        )::bigint as used_count
 from public.tags t
 where t.status in ('canonical','community')
 group by t.category
 order by t.category
$function$;

-- Staging acceptance cases:
-- 1. Guest counts only published/public 12+ works and comics.
-- 2. Signed-in 13–15 member sees up to their eligible rating, not 16+/18+.
-- 3. Adult sees eligible members-only entries, never hidden/draft/private.
-- 4. No private work/comic tags change visible usage_count or used_count.
-- 5. Both legacy and v2 tag search keep same columns and ranking behavior.
-- 6. Empty query/category and result limits preserve prior behavior.
-- 7. Compare query plans: do not ship if catalog browsing gets too slow.
