import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {STORY_COVER_BRANCH,storyCoverPreviewAllowed} from '../scripts/guard-story-cover-preview.mjs';
describe('cover-only branch preview safety',()=>{
 it('blocks the GitHub cover branch from Cloudflare production-backed PR previews',()=>{
  expect(storyCoverPreviewAllowed({CF_PAGES:'1',CF_PAGES_BRANCH:STORY_COVER_BRANCH})).toBe(false);
 });
 it('preserves normal live main, local and CI builds',()=>{
  expect(storyCoverPreviewAllowed({CF_PAGES:'1',CF_PAGES_BRANCH:'main'})).toBe(true);
  expect(storyCoverPreviewAllowed({CF_PAGES_BRANCH:STORY_COVER_BRANCH})).toBe(true);
 });
 it('invokes the branch isolation check before Vite builds',()=>{
  expect(JSON.parse(readFileSync('package.json','utf8')).scripts.build.startsWith('node scripts/guard-story-cover-preview.mjs &&')).toBe(true);
 });
});
