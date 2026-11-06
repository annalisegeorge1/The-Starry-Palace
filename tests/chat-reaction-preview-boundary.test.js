import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {REACTION_REVIEW_BRANCH,chatReactionPreviewAllowed} from '../scripts/guard-chat-reaction-preview.mjs';
describe('private chat review deployment boundary',()=>{
 it('blocks ordinary Cloudflare PR preview for this private chat change',()=>{
  expect(chatReactionPreviewAllowed({CF_PAGES:'1',CF_PAGES_BRANCH:REACTION_REVIEW_BRANCH})).toBe(false);
 });
 it('allows local tests and production main builds',()=>{
  expect(chatReactionPreviewAllowed({CF_PAGES:'1',CF_PAGES_BRANCH:'main'})).toBe(true);
  expect(chatReactionPreviewAllowed({CF_PAGES_BRANCH:REACTION_REVIEW_BRANCH})).toBe(true);
 });
 it('runs protection before compiling Vite',()=>{
  const p=JSON.parse(readFileSync('package.json','utf8'));
  expect(p.scripts.build.startsWith('node scripts/guard-chat-reaction-preview.mjs &&')).toBe(true);
 });
});
