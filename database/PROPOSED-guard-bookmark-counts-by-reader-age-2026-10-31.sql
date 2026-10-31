-- THE STARRY PALACE — PROPOSED REVIEW ONLY; DO NOT APPLY TO PRODUCTION
-- 2026-10-31: Reader-facing bookmark counts must honor minimum reading age.
-- Retains the existing 1..100 request limit, published-only scope, output shape,
-- sorting semantics (none), and public/member discovery behavior.
-- Owner/accepted-collaborator visibility matches public.works RLS.
-- Only apply after testing against two synthetic member identities and anon.

create or replace function public.get_reading_room_bookmark_counts(
  p_work_ids uuid[]
)
returns table(work_id uuid, bookmark_count bigint)
language sql
stable
security definer
set search_path to ''
as $function$
  select w.id, count(s.work_id)::bigint
  from public.works w
  left join public.saved_works s on s.work_id = w.id
  where cardinality(p_work_ids) between 1 and 100
    and w.id = any(p_work_ids)
    and w.publication_status = 'published'
    and (
      -- Author and accepted collaborators are permitted to see their work.
      w.author_id = (select auth.uid())
      or private.is_accepted_work_collaborator(w.id)
      or (
        (w.visibility = 'public'
          or (w.visibility = 'members' and (select auth.uid()) is not null))
        and private.member_meets_age(w.minimum_reader_age)
      )
    )
  group by w.id
$function$;

-- Synthetic staging cases:
-- * A guest sees published public 12+ counts, but not 13+/16+/18+ or members-only.
-- * A signed-in 13-year-old sees permitted 13+ but not 16+ or 18+.
-- * An eligible 18+ member sees public/members counts, but not private.
-- * An author and accepted collaborator see their published work.
-- * An unrelated reader sees no rows for private/hidden/draft/unknown works.
-- * Requesting 0 or >100 IDs returns no rows.
-- * A visible published story with no saved_works rows returns a count of 0.
-- * Existing grants and function signature remain unchanged by this candidate.
