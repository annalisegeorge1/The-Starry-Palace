import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const sql=readFileSync('database/repair-creative-points-publishing-and-revisions.sql','utf8');
const src=readFileSync('src/palaceData.js','utf8');

describe('actual chapter publishing earns creative rewards',()=>{
 it('covers chapter-first then parent-work publication order',()=>{
  expect(src.indexOf(".from('chapters').update({status:'published'")).toBeLessThan(src.indexOf("const update={publication_status:'published',last_published_at:now"));
  expect(sql).toContain('after update of publication_status,visibility on public.works');
  expect(sql).toContain("new.publication_status='published' and new.visibility='public'");
  expect(sql).toContain('private.credit_visible_published_chapters(new.id)');
 });
 it('credits eligible previous chapters only once, using original dedupe and day cap',()=>{
  expect(sql).toContain("l.dedupe_key='creative:publish:'||c.id::text");
  expect(sql).toContain("c.status='published' and c.word_count>=150");
  expect(sql).toContain('least(20,60-v_day)');
  expect(sql).toContain("source_kind in ('creative_chapter_publish','creative_chapter_revision')");
  expect(sql).toContain("perform pg_advisory_xact_lock(hashtext(v_author::text),7040410)");
  expect(sql).toContain("perform private.credit_visible_published_chapters(w.id)");
 });
 it('makes substantial revisions count without relying on a revision field never updated by the editor',()=>{
  expect(src).not.toContain('revision:patch.revision');
  expect(sql).toContain('elsif new.word_count>=old.word_count+150 then');
  expect(sql).not.toContain('new.revision>old.revision');
  expect(sql).toContain("interval '24 hours'");
  expect(sql).toContain("v_kind:='revision';v_amount:=10");
 });
 it('keeps server-only RPCs private and manuscripts intact',()=>{
  expect(sql).toContain('revoke all on function private.credit_visible_published_chapters(uuid) from public,anon,authenticated');
  expect(sql).toContain('revoke all on function private.reward_when_work_becomes_public() from public,anon,authenticated');
  expect(sql).not.toMatch(/\bupdate\s+public\.chapters\b/i);
  expect(sql).not.toMatch(/\btruncate\b/i);
  expect(sql).not.toMatch(/\bdisable\s+row\s+level\s+security\b/i);
 });
});