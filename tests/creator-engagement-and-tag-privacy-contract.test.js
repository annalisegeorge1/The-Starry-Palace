import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const sql=(name)=>readFileSync(resolve(process.cwd(),'database',name),'utf8')
  .replace(/--[^\n]*/g,'');
const shares=sql('PROPOSED-guard-shares-by-reader-age-2026-10-31.sql');
const praise=sql('PROPOSED-guard-praise-awards-by-reader-age-2026-10-31.sql');
const tags=sql('PROPOSED-public-tag-counts-visible-content-only-2026-10-31.sql');

// These tests inspect staged source; they are not Supabase integration tests.
describe('staged age-restricted engagement and tag privacy (source only)',()=>{
 it('guards sharing rewards by minimum-reader-age without changing caps',()=>{
  expect(shares).toMatch(/create or replace function public\.record_palace_share\(p_work_id uuid\)/i);
  expect(shares).toMatch(/security definer\s+set search_path to ''/i);
  expect(shares).toMatch(/and private\.member_meets_age\(w\.minimum_reader_age\)/i);
  expect(shares).toMatch(/if v_today < 15 then/i);
  expect(shares).toMatch(/least\(2,15-v_today\)/i);
  expect(shares).toMatch(/v_author,1,'receiving'/i);
  expect(shares).toMatch(/v_author=v_user/i);
 });
 it('guards praise for both published works and chapters by age',()=>{
  expect(praise).toMatch(/create or replace function public\.give_palace_praise/i);
  const checks=praise.match(/private\.member_meets_age\(w\.minimum_reader_age\)/g)||[];
  expect(checks).toHaveLength(2);
  expect(praise).toMatch(/c\.status='published'/i);
  expect(praise).toMatch(/if v_user is null then/i);
  expect(praise).toMatch(/if v_receiver=v_user then/i);
  for(const cap of ["'heart' then 20","'star' then 6","'moon' then 3","'crown' then 1"])expect(praise).toContain(cap);
  expect(praise).toContain('20-v_giver_today');
  expect(praise).toContain('50-v_receiver_today');
 });
 it('keeps both generations of tag search and family count signatures',()=>{
  expect(tags).toMatch(/create or replace function public\.search_palace_tags\s*\(/i);
  expect(tags).toMatch(/create or replace function public\.search_palace_tags_v2\s*\(/i);
  expect(tags).toMatch(/create or replace function public\.get_tag_family_counts\s*\(\s*\)/i);
  expect(tags).toMatch(/match_score double precision/i);
  expect(tags).toMatch(/usage_count bigint/i);
  expect(tags).toMatch(/used_count bigint/i);
 });
 it('counts only published discoverable and age-eligible works and comics',()=>{
  expect((tags.match(/w\.publication_status='published'/g)||[]).length).toBeGreaterThanOrEqual(3);
  expect((tags.match(/c\.publication_status='published'/g)||[]).length).toBeGreaterThanOrEqual(3);
  expect((tags.match(/private\.member_meets_age\(w\.minimum_reader_age\)/g)||[]).length).toBeGreaterThanOrEqual(3);
  expect((tags.match(/private\.member_meets_age\(c\.minimum_reader_age\)/g)||[]).length).toBeGreaterThanOrEqual(3);
  expect(tags).toMatch(/w\.visibility='members' and \(select auth\.uid\(\)\) is not null/i);
  expect(tags).toMatch(/c\.visibility='members' and \(select auth\.uid\(\)\) is not null/i);
  expect(tags).toContain('extensions.similarity');
  expect(tags).toContain('limit greatest(1,least(coalesce(p_limit,80),250))');
 });
});
