-- DISPOSABLE POSTGRES CHECK: run only in ephemeral CI DB.
-- Tests syntax, grants, RLS, metadata discoverability and chapter restrictions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users(id) VALUES
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
INSERT INTO public.profiles(id,username,display_name)
VALUES ('22222222-2222-4222-8222-222222222222','invented_author','Fictional Author'),
       ('33333333-3333-4333-8333-333333333333','invented_reader','Fictional Reader');
INSERT INTO private.member_age(user_id,birth_date)
VALUES ('33333333-3333-4333-8333-333333333333',current_date-interval '25 years');
INSERT INTO auth.users(id) VALUES ('14141414-1414-4414-8414-141414141414');
INSERT INTO public.profiles(id,username,display_name)
VALUES ('14141414-1414-4414-8414-141414141414','fictional_teen','Fictional Teen Reader');
INSERT INTO private.member_age(user_id,birth_date)
VALUES ('14141414-1414-4414-8414-141414141414',current_date-interval '15 years');

INSERT INTO public.works(id,author_id,slug,title,summary,work_type,rating,
 publication_status,visibility,minimum_reader_age,last_published_at)
VALUES
 ('44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222','light-harbor','A Fictional Harbor',
  'A completely invented staged original story.','original','general','published','public',13,now()),
 ('55555555-5555-4555-8555-555555555555',
  '22222222-2222-4222-8222-222222222222','adult-stars','A Fictional Night',
  'Fictional adult-rated metadata only.','fanwork','explicit','published','public',18,now()),
 ('66666666-6666-4666-8666-666666666666',
  '22222222-2222-4222-8222-222222222222','secret-draft','An Unpublished Story',
  'Author-only test draft.','fanwork','general','draft','private',13,now()),
 ('77777777-7777-4777-8777-777777777777',
  '22222222-2222-4222-8222-222222222222','member-chamber','For Members',
  'Members-only synthetic story.','original','teen','published','members',13,now());

INSERT INTO public.chapters(id,work_id,title,position,status,body_html,word_count)
VALUES
 ('88888888-8888-4888-8888-888888888888',
  '44444444-4444-4444-8444-444444444444','Chapter One',1,'published','<p>Invented test prose</p>',3),
 ('99999999-9999-4999-8999-999999999998',
  '55555555-5555-4555-8555-555555555555','Restricted Chapter',1,'published','<p>Private adult test</p>',4),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '66666666-6666-4666-8666-666666666666','Private Draft',1,'draft','<p>Unpublished test</p>',3);
INSERT INTO public.tags(id,name,category,status)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Moon Harbor Chronicles','fandom','canonical');
INSERT INTO public.work_tags(work_id,tag_id,position)
VALUES ('55555555-5555-4555-8555-555555555555','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1);

-- Archive hosting and Owner status are invented and exist only in this
-- disposable CI database, never in Supabase Security Staging.
INSERT INTO public.archive_records(id,slug,title,category,publication_status,host_mode,rights_status)
VALUES
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','invented-link','Fictional Link Only','licensed_fanfiction','published','citation','permission_pending'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','invented-unpublished','Unpublished Archive Fixture','licensed_fanfiction','draft','metadata_only','unresolved');
INSERT INTO public.archive_rights_records(record_id,basis,status,permits_hosting)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','unresolved','review',false);
INSERT INTO public.archive_texts(record_id,body_text,source_url,word_count)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Fictional short fixture text','https://example.invalid/fictional',5);
INSERT INTO auth.users(id) VALUES ('12121212-1212-4212-8212-121212121212');
INSERT INTO public.profiles(id,username,display_name)
VALUES ('12121212-1212-4212-8212-121212121212','invented_stage_owner','Staging-only Reviewer');
INSERT INTO public.platform_memberships(user_id,platform_role,suspended)
VALUES ('12121212-1212-4212-8212-121212121212','owner',false);

-- The default grants on new exposed tables must be intentionally revoked.
SELECT 1 / CASE WHEN
  NOT has_table_privilege('anon','public.archive_texts','SELECT')
  AND NOT has_column_privilege('authenticated','public.archive_texts','body_text','SELECT')
  AND has_column_privilege('authenticated','public.archive_texts','word_count','SELECT')
  THEN 1 ELSE 0 END AS archive_body_nonexposure;
-- Existing pre-populated stage dummy author remains intact.
SELECT 1 / CASE WHEN EXISTS(
 SELECT 1 FROM public.works WHERE id='11111111-1111-4111-8111-111111111111'::uuid
) THEN 1 ELSE 0 END AS fixture_preserved;

BEGIN;
SET LOCAL ROLE anon;
-- Anonymous users see public General and adult-rated *metadata*.
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.works WHERE publication_status='published')=2
 THEN 1 ELSE 0 END AS signed_out_published_metadata;
-- Anonymous users must not see any draft/member-only chapter text, nor adult text.
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.chapters)=1
 THEN 1 ELSE 0 END AS signed_out_chapter_age_gate;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.archive_records)=1
 THEN 1 ELSE 0 END AS published_archive_only;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.archive_rights_records)=0
 THEN 1 ELSE 0 END AS pending_rights_are_not_public;
SELECT 1 / CASE WHEN (public.search_published_works_v2(p_origin=>'fandom')->>'total')::integer=1
 THEN 1 ELSE 0 END AS adult_metadata_searchable;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
SET LOCAL ROLE authenticated;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.chapters)=2
 THEN 1 ELSE 0 END AS adult_client_chapter_access;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.works WHERE publication_status='draft')=0
 THEN 1 ELSE 0 END AS other_user_draft_hidden;
SELECT 1 / CASE WHEN (SELECT count(record_id) FROM public.archive_texts)=0
 THEN 1 ELSE 0 END AS non_owner_archive_index_hidden;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub','12121212-1212-4212-8212-121212121212',true);
SET LOCAL ROLE authenticated;
SELECT 1 / CASE WHEN (SELECT count(record_id) FROM public.archive_texts)=1
 THEN 1 ELSE 0 END AS owner_archive_index_readable;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.works WHERE publication_status='draft')=0
 THEN 1 ELSE 0 END AS owner_cannot_read_other_authors_private_drafts;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub','14141414-1414-4414-8414-141414141414',true);
SET LOCAL ROLE authenticated;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.chapters)=1
 THEN 1 ELSE 0 END AS under_18_chapter_access;
SELECT 1 / CASE WHEN (SELECT count(*) FROM public.works
 WHERE rating='explicit' AND publication_status='published')=1
 THEN 1 ELSE 0 END AS under_18_adult_metadata_is_searchable;
ROLLBACK;

-- No real account or content ever leaves this ephemeral Postgres container.
