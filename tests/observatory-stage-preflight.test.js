import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const sql=readFileSync('database/palace-observatory-stage-preflight.sql','utf8');
const plan=readFileSync('docs/palace-observatory-staging-compatibility-plan.md','utf8');
const executable=sql.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');

describe('Observatory staging schema audit must be read-only and non-production',()=>{
 it('contains only catalogue inspection, not schema changes or data access',()=>{
  expect(executable).toMatch(/^\s*WITH\s+required_columns/i);
  expect(executable).toMatch(/SELECT\s+jsonb_build_object\(/i);
  expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE|DO|COPY|CALL)\s/i);
  expect(executable).toContain('information_schema.columns');
  expect(executable).toContain('pg_catalog.pg_policy');
  expect(executable).toContain('pg_catalog.has_function_privilege');
  expect(executable).not.toMatch(/\b(?:body_html|body_text|password|service_role|email)\b/i);
 });
 it('checks the core public reader and private owner dependencies',()=>{
  for(const name of ['works','profiles','work_tags','tags','chapters','comments',
   'fandom_directory','archive_records','archive_rights_records','archive_texts','platform_memberships']){
   expect(sql).toContain("('"+name+"','");
  }
  expect(sql).toContain("('public','search_published_works_v2')");
  expect(sql).toContain("('private','has_platform_role')");
 });
 it('records separated, least-privilege staging approval gates',()=>{
  for(const term of ['50 missing','12 historical synthetic','SECURITY INVOKER',
   'deny-by-default','staging Auth only','separate schema+storage sign-off']){
   expect(plan).toContain(term);
  }
  expect(plan).toContain('No schema migration');
  expect(plan).toContain('15 real-browser acceptance cases');
 });
});
