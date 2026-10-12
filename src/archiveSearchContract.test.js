import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const migration=readFileSync('supabase/migrations/20261012163000_published_archive_precision_search.sql','utf8');
const data=readFileSync('src/palaceData.js','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
const room=live.split('export function ReadingLive({Frame})')[1].split('export function WritingLive({Frame})')[0];

describe('archive-wide public story search',()=>{
 it('queries the database before paging, with RLS and published-only safeguards',()=>{
  expect(migration).toContain('security invoker');
  expect(migration).toContain("w.publication_status='published'");
  expect(migration).toContain("w.visibility='public'");
  expect(migration).toContain("w.visibility='members' and auth.uid() is not null");
  expect(migration).toContain("t.status in ('canonical','community')");
  expect(migration).toContain('not exists (');
  expect(migration).toContain('unnest(a.including)');
  expect(migration).toContain('wt.tag_id=any(a.excluding)');
  expect(migration.indexOf('from matches m')).toBeLessThan(migration.indexOf('limit (select batch from args)'));
  expect(migration).toContain("'total', (select count(*) from matches)");
  expect(migration).toContain('grant execute on function public.search_published_works_v2');
  expect(migration).not.toMatch(/security definer|service_role|body_html|scheduled_for/);
 });
 it('uses full published work RPC, not old first-100 tag-filter approximation',()=>{
  const search=data.split('export async function searchPublishedArchive(')[1].split('export async function searchWorksByTags(')[0];
  expect(search).toContain("needClient().rpc('search_published_works_v2',args)");
  expect(search).toContain('p_min_words:numeric(filters.minWords)');
  expect(search).toContain('p_max_words:numeric(filters.maxWords)');
  expect(search).toContain('p_offset:');
  expect(search).not.toContain('.limit(100)');
 });
 it('has accurate server paging and keeps guest browsing public',()=>{
  expect(room).toContain('const answer=await searchPublishedArchive({');
  expect(room).toContain('setAdvancedTotal(answer.total)');
  expect(room).toContain('setAdvancedPage(page)');
  expect(room).toContain('limit:20,offset:page*20');
  expect(room).toContain('const advancedFiltered=advancedResults;');
  expect(room).toContain('advancedTotal.toLocaleString()');
  expect(room).toContain('palace-archive-pagination');
  expect(room).toContain("!session&&<GuestReadingInvitation");
  expect(room).toContain('advancedRequest.current');
  expect(room).toContain('advancedMinWords');
  expect(room).toContain('advancedMaxWords');
 });
});
