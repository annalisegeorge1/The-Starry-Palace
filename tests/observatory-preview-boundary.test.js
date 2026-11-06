import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {verifyObservatoryPreviewBoundary,OBSERVATORY_REVIEW_BRANCH,OBSERVATORY_STAGE_URL} from '../scripts/verify-observatory-preview-boundary.mjs';

const cloudflareDraft={
 CF_PAGES:'1',CF_PAGES_BRANCH:OBSERVATORY_REVIEW_BRANCH,
 VITE_SUPABASE_URL:'https://sservftxygunkacmwsad.supabase.co',
 VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_only_not_real_abcdefgh',
 VITE_GOOGLE_LOGIN_ENABLED:'true'
};
describe('Observatory automatic PR preview deployment isolation',()=>{
 it('refuses an Observatory Pages preview connected to real production',()=>{
  const result=verifyObservatoryPreviewBoundary(cloudflareDraft);
  expect(result.ok).toBe(false);
  expect(result.reason).toMatch(/isolated staging/);
 });
 it('refuses the draft even with staging Supabase until separately approved',()=>{
  const prepared={...cloudflareDraft,VITE_SUPABASE_URL:OBSERVATORY_STAGE_URL,
   VITE_OBSERVATORY_STAGE:'true',VITE_GOOGLE_LOGIN_ENABLED:'false'};
  expect(verifyObservatoryPreviewBoundary(prepared).ok).toBe(false);
  expect(verifyObservatoryPreviewBoundary({...prepared,VITE_OBSERVATORY_PREVIEW_APPROVED:'true'}).ok).toBe(true);
 });
 it('continues allowing the production main build and local CI without preview credentials',()=>{
  expect(verifyObservatoryPreviewBoundary({CF_PAGES:'1',CF_PAGES_BRANCH:'main'}).ok).toBe(true);
  expect(verifyObservatoryPreviewBoundary({CF_PAGES:'',CF_PAGES_BRANCH:OBSERVATORY_REVIEW_BRANCH}).ok).toBe(true);
  expect(verifyObservatoryPreviewBoundary({}).ok).toBe(true);
 });
 it('requires correct staging key and disabled Google login even with an approval marker',()=>{
  const staged={...cloudflareDraft,VITE_SUPABASE_URL:OBSERVATORY_STAGE_URL,
   VITE_OBSERVATORY_STAGE:'true',VITE_OBSERVATORY_PREVIEW_APPROVED:'true',
   VITE_GOOGLE_LOGIN_ENABLED:'false'};
  expect(verifyObservatoryPreviewBoundary({...staged,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_never'}).ok).toBe(false);
  expect(verifyObservatoryPreviewBoundary({...staged,VITE_GOOGLE_LOGIN_ENABLED:'true'}).ok).toBe(false);
 });
 it('runs the guard before compiling an Observatory Pages preview',()=>{
  const scripts=JSON.parse(readFileSync('package.json','utf8')).scripts;
  expect(scripts.build.startsWith('node scripts/verify-observatory-preview-boundary.mjs &&')).toBe(true);
 });
});
