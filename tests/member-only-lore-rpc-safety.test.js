import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const migration=readFileSync('database/guard-member-only-lore-rpc.sql','utf8');
const client=readFileSync('src/palaceData.js','utf8');

describe('member-only story lore never becomes anonymous through privileged RPC',()=>{
 it('preserves the original work-lore RPC signature and owner access',()=>{
  expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_work_lore(p_work_id uuid)');
  expect(migration).toContain('SECURITY DEFINER');
  expect(migration).toContain("SET search_path TO ''");
  expect(migration).toContain('v_user=v_owner');
  expect(migration).toContain('when v_user=v_owner then l.body');
  expect(client).toContain("rpc('get_work_lore',{p_work_id:workId})");
 });
 it('serves public published lore to guests but requires sign-in for members-only works',()=>{
  expect(migration).toContain("w.publication_status='published'");
  expect(migration).toContain("(w.visibility='public' or (w.visibility='members' and v_user is not null))");
  expect(migration).not.toContain("w.visibility in ('public','members')");
  expect(migration).toContain("l.reveal_mode<>'private'");
 });
 it('preserves spoiler unlock rules and never adds a broad table policy or data-changing step',()=>{
  expect(migration).toContain("when l.reveal_mode='after_chapter'");
  expect(migration).toContain("from public.work_lore_entries l");
  expect(migration).not.toMatch(/\bcreate\s+policy\b/i);
  expect(migration).not.toMatch(/\bdisable\s+row\s+level\s+security\b/i);
  expect(migration).not.toMatch(/\b(delete|truncate)\s+from\b/i);
 });
});
