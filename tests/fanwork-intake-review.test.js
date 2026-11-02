import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fanworkReviewStatus,fanworkQueueOverview,inspectStagedFanwork,fanworkAuthorRequest}
 from '../src/fanworkIntakeReviewModel.js';

const base={
 id:'example',slug:'naruto-1',title:'The First Light',creator:'Example Fan Writer',
 originalRating:'teen',fandom:'Naruto',
 expectedChapters:2,sourceUrl:'https://example.org/stories/1',
 permissionUrl:'https://example.org/author/1',
 stagedWords:0,rightsGrants:[]
};
describe('Private licensed fanfiction review readiness',()=>{
 it('does not mark metadata-only works as readable',()=>{
  const result=fanworkReviewStatus(base,'2026-11-01');
  expect(result.stage).toBe('awaiting_manuscript');
  expect(result.hasText).toBe(false);
  expect(result.hasVerifiedGrant).toBe(false);
  expect(result.issues).toContain('Full author-supplied manuscript not staged');
  expect(fanworkQueueOverview([base]).awaitingText).toBe(1);
 });
 it('distinguishes pending, expired and currently verified grants',()=>{
  const pending={...base,stagedWords:2450,rightsGrants:[{
   status:'review',permits_hosting:false
  }]};
  expect(fanworkReviewStatus(pending,'2026-11-01').label).toBe('Permission under review');
  const expired={...pending,rightsGrants:[{
   status:'verified',permits_hosting:true,valid_until:'2026-10-31'
  }]};
  expect(fanworkReviewStatus(expired,'2026-11-01').hasVerifiedGrant).toBe(false);
  expect(fanworkReviewStatus(expired,'2026-11-01').hasExpiredGrant).toBe(true);
  const valid={...pending,rightsGrants:[{
   status:'verified',permits_hosting:true,valid_from:'2026-10-01',valid_until:'2026-12-31'
  }]};
  const current=fanworkReviewStatus(valid,'2026-11-01');
  expect(current.stage).toBe('editorial_review');
  expect(current.label).toBe('Eligible for final editorial review');
  expect(current.hasVerifiedGrant).toBe(true);
  expect(fanworkQueueOverview([base,pending,expired,valid]).staged).toBe(3);
  expect(fanworkQueueOverview([base,pending,expired,valid]).editorialReview).toBe(1);
 });
 it('flags mature work for additional access review and never treats age rating as permission',()=>{
  const work={...base,originalRating:'mature',stagedWords:2000};
  const r=fanworkReviewStatus(work,'2026-11-01');
  expect(r.requiresAdultReview).toBe(true);
  expect(r.issues.some(x=>x.includes('18+'))).toBe(true);
  expect(r.hasVerifiedGrant).toBe(false);
 });
 it('detects original chapter boundaries only as a non-destructive advisory',()=>{
  const original='Chapter 1: Arrival\n\nA story begins here.\n\nChapter 2: Departure\n\nA story continues here.';
  const result=inspectStagedFanwork(original,2);
  expect(result.detectedChapters).toBe(2);
  expect(result.sections).toEqual(['Chapter 1: Arrival','Chapter 2: Departure']);
  expect(result.issues).toHaveLength(0);
  const incomplete=inspectStagedFanwork(original,10);
  expect(incomplete.issues.some(issue=>issue.includes('source lists 10'))).toBe(true);
  expect(original).toContain('Chapter 2: Departure');
  expect(result.note).toContain('does not alter');
 });
 it('generates a specific author request rather than claiming a public CC profile clears republication',()=>{
  const msg=fanworkAuthorRequest(base);
  expect(msg).toContain('Hello Example Fan Writer');
  expect(msg).toContain('The First Light');
  expect(msg).toContain('https://thestarrypalace.com');
  expect(msg).toContain('host your original text');
  expect(msg).toContain('underlying franchise rights');
  expect(msg).toContain('not publish your text');
  expect(msg).not.toMatch(/chat\s?gpt|openai/i);
 });
 it('loads manuscript body only on deliberate curator inspection, keeps publication separate',()=>{
  const source=readFileSync('src/curatorFanworkIntakeData.js','utf8');
  const ui=readFileSync('src/CuratorFanworkIntake.jsx','utf8');
  expect(source).toContain('getCuratorFanworkManuscriptPreview');
  expect(source).toContain(".select('record_id,body_text,word_count,updated_at')");
  expect(source).toContain(".select('record_id,basis,status,permits_hosting,valid_from,valid_until,verified_at')");
  expect(ui).toContain('onClick={reviewManuscript}');
  expect(ui).toContain('onClick={prepareAuthorRequest}');
  expect(ui).toContain('Ready for');
  expect(source).not.toContain("publication_status:'published'");
  expect(ui).not.toMatch(/chat\s?gpt|openai/i);
 });
});
