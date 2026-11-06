import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const schema=read('database/palace-observatory-stage-additive-schema-PROPOSAL.sql');
const search=read('database/palace-observatory-stage-published-search-PROPOSAL.sql');
const age=read('database/palace-observatory-stage-age-13-PROPOSAL.sql');
const rpcGrants=read('database/palace-observatory-stage-mutation-rpc-grants-PROPOSAL.sql');
const postgresReview=read('.github/workflows/palace-observatory-postgres-review.yml');
const sqlSmoke=read('tests/sql/palace-observatory-postgres-smoke.sql');
const canonical=read('supabase/migrations/20261012163000_published_archive_precision_search.sql').trim();
const guide=read('docs/palace-observatory-staging-migration-review.md');
const fixtures=JSON.parse(read('tests/fixtures/palace-observatory-stage-scenarios.json'));
const executable=s=>s.split('\n').filter(x=>!/^\s*--/.test(x)).join('\n');

describe('Draft-only additive staging database package',()=>{
 it('never targets an unknown or production environment without aborting',()=>{
  for(const script of [schema,search,age,rpcGrants]){
   expect(script).toContain("to_regclass('private.staging_chat_rooms')");
   expect(script).toContain('RAISE EXCEPTION');
   expect(script).toMatch(/BEGIN;[\s\S]*COMMIT;/);
   expect(script).toContain('REVIEW-ONLY');
  }
  expect(schema).toContain("to_regclass('public.profiles')");
  expect(schema).toContain("NOT VALID");
  expect(schema).toContain('works_author_id_fkey');
 });
 it('extends security fixtures without deleting their tables, policies or actual contents',()=>{
  const query=executable(schema);
  expect(query).not.toMatch(/\b(?:DROP|TRUNCATE)\s+(?:TABLE|SCHEMA)\b/i);
  expect(query).not.toMatch(/\bDELETE\s+FROM\b/i);
  expect(query).not.toMatch(/\bCOPY\s+[^\n]+\s+FROM\b/i);
  expect(query).toContain('ALTER TABLE public.works');
  expect(query).toContain('ALTER TABLE public.chapters');
  expect(query).toContain('ALTER TABLE public.work_tags');
  // RLS cannot prevent TRUNCATE; browser roles must retain SELECT only.
  expect(query).toContain('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
  expect(query).toContain('ON TABLE public.works, public.chapters, public.tags, public.work_tags');
  for(const table of ['profiles','fandom_directory','archive_records','archive_rights_records','archive_texts','platform_memberships','comments']){
   expect(query).toContain('CREATE TABLE public.'+table);
   expect(query).toContain('ALTER TABLE public.'+table+' ENABLE ROW LEVEL SECURITY;');
   expect(query).toContain('REVOKE ALL ON TABLE public.'+table+' FROM PUBLIC, anon, authenticated;');
  }
 });
 it('separates published searchable metadata from restricted text and owner powers',()=>{
  expect(schema).toContain("publication_status='published'");
  expect(schema).toContain('private.can_read_chapter(work_id,status)');
  expect(schema).toContain('GRANT SELECT(record_id,word_count,source_url) ON public.archive_texts TO authenticated;');
  expect(executable(schema)).not.toMatch(/GRANT\s+SELECT\s+ON\s+public\.archive_texts\s+TO\s+anon/i);
  expect(schema).toContain('CREATE POLICY observatory_stage_own_membership');
  expect(schema).toContain('pm.suspended=false');
  expect(schema).toContain('REVOKE ALL ON FUNCTION private.has_platform_role(text[]) FROM PUBLIC;');
  expect(executable(schema)).not.toMatch(/INSERT\s+INTO\s+public\.platform_memberships/i);
  expect(executable(schema)).not.toMatch(/CREATE\s+(TABLE|POLICY)\s+public\.observatory_issues/i);
 });
 it('uses the exact existing RLS-invoker published-search SQL',()=>{
  expect(search).toContain(canonical);
  expect(search).toMatch(/language sql stable security invoker/i);
  expect(search).toContain("create or replace function public.search_published_works_v2");
  expect(search).toContain("revoke all on function public.search_published_works_v2");
 });
 it('removes guest execution for reward mutations without touching public discovery RPCs',()=>{
  expect(rpcGrants).toContain('REVOKE EXECUTE ON FUNCTION');
  expect(rpcGrants).toContain('public.give_palace_praise(text,uuid,text)');
  expect(rpcGrants).toContain('public.record_palace_share(uuid)');
  expect(rpcGrants).toContain('FROM PUBLIC, anon;');
  expect(rpcGrants).toContain("has_function_privilege('authenticated'");
  expect(executable(rpcGrants)).not.toMatch(/\b(?:CREATE|REPLACE|DROP)\s+FUNCTION\b/i);
  expect(executable(rpcGrants)).not.toMatch(/\bGRANT\s+EXECUTE\b/i);
  expect(rpcGrants).not.toContain('search_palace_tags');
  expect(rpcGrants).not.toContain('get_tag_family_counts');
  expect(sqlSmoke).toContain('only_authenticated_reward_rpc_execution');
  expect(postgresReview).toContain("postgres: ['16', '17']");
  expect(postgresReview).toContain('palace-observatory-stage-mutation-rpc-grants-PROPOSAL.sql');
 });
 it('keeps the age correction separately reviewable and adult chapter restrictions intact',()=>{
  expect(age).toContain('coalesce(p_minimum_age,13)<=13');
  expect(age).toContain("greatest(coalesce(p_minimum_age,13),13)");
  expect(age).toContain('private.member_age');
  expect(age).not.toContain('coalesce(p_minimum_age,12)<=12');
  expect(age).not.toMatch(/\b(?:INSERT|UPDATE|DELETE)\s+public\./);
 });
 it('stores only fictional plans and does not provision users or publish copyrighted works',()=>{
  expect(fixtures.stageOnly).toBe(true);
  expect(fixtures.minMemberAge).toBe(13);
  expect(fixtures.authRequirement).toContain('staging Auth');
  expect(fixtures.workCases).toHaveLength(6);
  expect(fixtures.workCases.find(w=>w.fixture==='public-explicit')?.expected.anonymousMetadata).toBe(true);
  expect(fixtures.workCases.find(w=>w.fixture==='public-explicit')?.expected.anonymousChapterAfterAgeFix).toBe(false);
  expect(fixtures.workCases.find(w=>w.fixture==='private-draft')?.expected.anonymousMetadata).toBe(false);
  expect(fixtures.archiveCases.find(w=>w.fixture==='rights-pending-link')?.expected.mayHostText).toBe(false);
  expect(JSON.stringify(fixtures)).not.toMatch(/@gmail\.com|@outlook\.com|service_role|sb_secret_/i);
  expect(guide).toContain('No SQL changes have been applied');
  expect(guide).toContain('ephemeral PostgreSQL **16 and 17** databases');
  expect(guide).toContain('the complete existing security-staging schema');
 });
});
