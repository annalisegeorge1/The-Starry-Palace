import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// These are source-contract checks for UNAPPLIED SQL candidates.
// Passing does NOT mean the SQL has been executed, or that RLS/RPC
// behavior has been tested with real Postgres roles in staging.
const readSql=file=>readFileSync(resolve(process.cwd(),'database',file),'utf8')
  .replace(/--[^\n]*/g,'');

const praise=readSql('PROPOSED-restrict-praise-state-visibility-2026-10-31.sql');
const bookmarks=readSql('PROPOSED-guard-bookmark-counts-by-reader-age-2026-10-31.sql');

describe('staged creator privacy SQL contract (not a database integration test)',()=>{
 it('preserves the public praise RPC signature and pins its definer search path',()=>{
  expect(praise).toMatch(/create or replace function public\.get_palace_praise_state\s*\(\s*p_target_kind text,\s*p_target_id uuid\s*\)/i);
  expect(praise).toMatch(/returns jsonb\s+language plpgsql\s+security definer\s+set search_path to ''/i);
 });
 it('guards both work and chapter praise using existing visibility checks',()=>{
  expect(praise).toMatch(/private\.is_work_owner\(w\.id\)/i);
  expect(praise).toMatch(/private\.is_accepted_work_collaborator\(w\.id\)/i);
  expect(praise).toMatch(/private\.member_meets_age\(w\.minimum_reader_age\)/i);
  expect(praise).toMatch(/private\.can_read_chapter\(c\.work_id, c\.status\)/i);
  expect(praise).toMatch(/if not coalesce\(v_allowed, false\) then[\s\S]*?return jsonb_build_object/i);
  expect(praise).toMatch(/where giver_id = v_user and target_kind = p_target_kind and target_id = p_target_id/i);
 });
 it('preserves count RPC output and request limits with age-aware access',()=>{
  expect(bookmarks).toMatch(/create or replace function public\.get_reading_room_bookmark_counts\s*\(\s*p_work_ids uuid\[\]\s*\)/i);
  expect(bookmarks).toMatch(/returns table\(work_id uuid, bookmark_count bigint\)\s+language sql\s+stable\s+security definer\s+set search_path to ''/i);
  expect(bookmarks).toMatch(/cardinality\(p_work_ids\) between 1 and 100/i);
  expect(bookmarks).toMatch(/w\.publication_status = 'published'/i);
  expect(bookmarks).toMatch(/private\.member_meets_age\(w\.minimum_reader_age\)/i);
  expect(bookmarks).toMatch(/w\.visibility = 'members' and \(select auth\.uid\(\)\) is not null/i);
  expect(bookmarks).toMatch(/private\.is_accepted_work_collaborator\(w\.id\)/i);
 });
});
