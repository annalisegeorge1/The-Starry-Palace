import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const sql=readFileSync('database/restrict-rewards-to-readable-works.sql','utf8');
const praise=sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.give_palace_praise'),sql.indexOf('CREATE OR REPLACE FUNCTION public.record_palace_share'));
const share=sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.record_palace_share'));

describe('Celestial Points respect story visibility',()=>{
 it('only awards praise on visible published works and visible published chapters',()=>{
  expect(praise).toContain("where w.id=p_target_id and w.publication_status='published'");
  expect(praise).toContain("where c.id=p_target_id and c.status='published' and w.publication_status='published'");
  expect((praise.match(/and w\.visibility in \('public','members'\)/g)||[])).toHaveLength(2);
  expect(praise).toContain('if v_user is null then raise exception');
  expect(praise).toContain('if v_receiver=v_user then raise exception');
 });
 it('rejects reward-triggering share requests for hidden or private published stories',()=>{
  expect(share).toContain("where id=p_work_id and publication_status='published'");
  expect(share).toContain("and visibility in ('public','members')");
  expect(share).toContain('if v_user is null then raise exception');
  expect(share).toContain("if v_author=v_user then return jsonb_build_object");
 });
 it('retains the existing reward limits, idempotency and per-user ledger',()=>{
  expect(praise).toContain('v_type_limit := case p_praise_type');
  expect(praise).toContain('private.grant_celestial_points(');
  expect(praise).toContain('on conflict(giver_id,target_kind,target_id)');
  expect(share).toContain("where user_id=v_user and channel='participation'");
  expect(share).toContain('private.grant_celestial_points(');
  expect(share).toContain("'share:'||v_user||':'||p_work_id||':'||v_week");
 });
 it('does not broaden table privileges or mutate stored manuscripts',()=>{
  expect(sql).not.toMatch(/\bcreate\s+policy\b/i);
  expect(sql).not.toMatch(/\balter\s+table\b/i);
  expect(sql).not.toMatch(/\bgrant\s+execute\b/i);
  expect(sql).not.toMatch(/\bdrop\s+table\b/i);
  expect(sql).not.toMatch(/\bdelete\s+from\s+public\.works\b/i);
 });
});
