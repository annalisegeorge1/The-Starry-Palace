-- THE PALACE OBSERVATORY — STAGING-ONLY SCHEMA READINESS AUDIT
-- READ-ONLY.  This file contains SELECT statements only.
-- Inspect structure and grants; never query production member rows or manuscripts.
-- Do not install the Observatory issue schema or seed real member data as part of this audit.
--
-- Run on the isolated Security Staging project; a production invocation would
-- still read only schema metadata, but is unnecessary for staging readiness.
WITH
required_columns(table_name,column_name) AS (
 VALUES
  ('works','id'),
  ('works','author_id'),
  ('works','slug'),
  ('works','title'),
  ('works','summary'),
  ('works','work_type'),
  ('works','rating'),
  ('works','language'),
  ('works','completion_status'),
  ('works','cover_url'),
  ('works','first_published_at'),
  ('works','last_published_at'),
  ('works','publication_status'),
  ('works','visibility'),
  ('works','minimum_reader_age'),
  ('profiles','id'),
  ('profiles','username'),
  ('profiles','display_name'),
  ('profiles','avatar_url'),
  ('profiles','title'),
  ('work_tags','work_id'),
  ('work_tags','tag_id'),
  ('tags','id'),
  ('tags','name'),
  ('tags','category'),
  ('tags','status'),
  ('chapters','id'),
  ('chapters','work_id'),
  ('chapters','status'),
  ('chapters','word_count'),
  ('comments','id'),
  ('comments','work_id'),
  ('comments','status'),
  ('fandom_directory','tag_id'),
  ('fandom_directory','aliases'),
  ('fandom_directory','media_categories'),
  ('fandom_directory','subcategory'),
  ('fandom_directory','franchise'),
  ('archive_records','id'),
  ('archive_records','title'),
  ('archive_records','slug'),
  ('archive_records','creator_name'),
  ('archive_records','category'),
  ('archive_records','publication_status'),
  ('archive_records','host_mode'),
  ('archive_records','rights_status'),
  ('archive_records','rating'),
  ('archive_records','hosted_word_count'),
  ('archive_records','minimum_reader_age'),
  ('archive_records','source_notes'),
  ('archive_rights_records','id'),
  ('archive_rights_records','record_id'),
  ('archive_rights_records','basis'),
  ('archive_rights_records','status'),
  ('archive_rights_records','permits_hosting'),
  ('archive_rights_records','verified_at'),
  ('archive_rights_records','valid_from'),
  ('archive_rights_records','valid_until'),
  ('archive_texts','record_id'),
  ('archive_texts','word_count'),
  ('archive_texts','source_url'),
  ('platform_memberships','user_id'),
  ('platform_memberships','platform_role'),
  ('platform_memberships','suspended')
),
missing_columns AS (
 SELECT r.table_name,r.column_name
 FROM required_columns r
 LEFT JOIN information_schema.columns col
  ON col.table_schema='public' AND col.table_name=r.table_name
  AND col.column_name=r.column_name
 WHERE col.column_name IS NULL
),
required_functions(schema_name,function_name) AS (
 VALUES
  ('public','search_published_works_v2'),
  ('private','has_platform_role')
),
functions_found AS (
 SELECT r.schema_name,r.function_name,
  EXISTS(
   SELECT 1 FROM pg_catalog.pg_proc p
   JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname=r.schema_name AND p.proname=r.function_name
  ) AS present
 FROM required_functions r
),
rls_review AS (
 SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_catalog.pg_policy pol WHERE pol.polrelid=c.oid) AS policy_count
 FROM pg_catalog.pg_class c
 JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN (SELECT DISTINCT table_name FROM required_columns)
),
function_review AS (
 SELECT n.nspname AS schema_name,p.proname AS function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
  pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') AS member_can_execute
 FROM pg_catalog.pg_proc p
 JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
 AND p.proname IN ('get_palace_praise_state','get_tag_family_counts',
  'give_palace_praise','record_palace_share','search_palace_tags','search_palace_tags_v2')
)
SELECT jsonb_build_object(
 'audit','palace_observatory_staging_read_only_v1',
 'missing_columns',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'table',table_name,'column',column_name) ORDER BY table_name,column_name),'[]'::jsonb)
  FROM missing_columns),
 'required_functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY schema_name,function_name),'[]'::jsonb)
  FROM functions_found f),
 'rls_review',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY table_name),'[]'::jsonb)
  FROM rls_review r),
 'privileged_functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY function_name,arguments),'[]'::jsonb)
  FROM function_review f)
) AS staging_schema_readiness;
