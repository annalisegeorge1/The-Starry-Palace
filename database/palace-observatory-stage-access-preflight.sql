-- PALACE OBSERVATORY SECURITY STAGING PERMISSION PREFLIGHT.
-- READ ONLY. Safe for isolated stage catalog inspection; no member data queries.
-- Run before any migration and compare to the independent Supabase project ID.
-- A PostgreSQL query cannot prove that a recoverable platform backup exists.
WITH
public_tables AS (
 SELECT c.oid,c.relname,c.relrowsecurity
 FROM pg_catalog.pg_class c
 JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
),
reader_grants AS (
 SELECT t.relname,
  pg_catalog.has_table_privilege('anon',t.oid,'INSERT') AS anonymous_insert,
  pg_catalog.has_table_privilege('anon',t.oid,'UPDATE') AS anonymous_update,
  pg_catalog.has_table_privilege('anon',t.oid,'DELETE') AS anonymous_delete,
  pg_catalog.has_table_privilege('anon',t.oid,'TRUNCATE') AS anonymous_truncate,
  pg_catalog.has_table_privilege('anon',t.oid,'REFERENCES') AS anonymous_references,
  pg_catalog.has_table_privilege('anon',t.oid,'TRIGGER') AS anonymous_trigger,
  pg_catalog.has_table_privilege('authenticated',t.oid,'INSERT') AS member_insert,
  pg_catalog.has_table_privilege('authenticated',t.oid,'UPDATE') AS member_update,
  pg_catalog.has_table_privilege('authenticated',t.oid,'DELETE') AS member_delete,
  pg_catalog.has_table_privilege('authenticated',t.oid,'TRUNCATE') AS member_truncate,
  pg_catalog.has_table_privilege('authenticated',t.oid,'REFERENCES') AS member_references,
  pg_catalog.has_table_privilege('authenticated',t.oid,'TRIGGER') AS member_trigger,
  t.relrowsecurity AS rls_enabled
 FROM public_tables t
 WHERE t.relname IN ('works','chapters','tags','work_tags')
),
policies AS (
 SELECT t.relname,count(p.oid)::integer AS policy_count
 FROM public_tables t
 LEFT JOIN pg_catalog.pg_policy p ON p.polrelid=t.oid
 GROUP BY t.relname
),
routine_grants AS (
 SELECT p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') AS anon_executable,
  pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') AS member_executable
 FROM pg_catalog.pg_proc p
 JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN (
  'give_palace_praise','record_palace_share','search_palace_tags',
  'search_palace_tags_v2','get_tag_family_counts','get_palace_praise_state')
)
SELECT jsonb_build_object(
 'catalog_audit','observatory_stage_access_before_migration',
 'stage_sentinel_present',to_regclass('private.staging_chat_rooms') IS NOT NULL,
 'compatibility_tables_absent',
  to_regclass('public.profiles') IS NULL
  AND to_regclass('public.fandom_directory') IS NULL,
 'public_table_count',(SELECT count(*) FROM public_tables),
 'public_rls_tables',(SELECT count(*) FROM public_tables WHERE relrowsecurity),
 'reader_grants',(SELECT coalesce(jsonb_agg(to_jsonb(g) ORDER BY relname),'[]'::jsonb)
   FROM reader_grants g),
 'table_policy_counts',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY relname),'[]'::jsonb)
   FROM policies p),
 'public_definer_routines',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY proname),'[]'::jsonb)
   FROM routine_grants f)
) AS access_audit;
