import {describe,it,expect} from 'vitest';
import {
 OBSERVATORY_ISSUE_STATUSES,observatoryCanTransition,observatoryNextStatuses,
 observatoryValidateIssue,observatoryValidateTransition,observatoryFindingDraft,
 observatoryValidateScreenshot
} from '../src/palaceObservatoryIssuesModel.js';

const base={title:'Missing fandom result',surface:'Fandom',
 severity:'High',expected:'Published work appears with its fandom tag',
 observed:'The work does not appear in the author’s fandom shelf',steps:'Open /fandoms and select the fandom'};
describe('Palace Observatory Phase 3 issue lifecycle',()=>{
 it('keeps stages explicit and non-publishing',()=>{
  expect(OBSERVATORY_ISSUE_STATUSES).toContain('Awaiting Review');
  expect(observatoryCanTransition('New','Rechecked')).toBe(false);
  expect(observatoryCanTransition('New','Investigating')).toBe(true);
  expect(observatoryCanTransition('Investigating','Fix Proposed')).toBe(true);
  expect(observatoryCanTransition('Fix Proposed','Awaiting Review')).toBe(true);
  expect(observatoryCanTransition('Awaiting Review','Fixed')).toBe(true);
  expect(observatoryCanTransition('Fixed','Rechecked')).toBe(true);
  expect(observatoryCanTransition('Rechecked','Reopened')).toBe(true);
  expect(observatoryNextStatuses('Rechecked')).toEqual(['Reopened']);
 });
 it('requires a review/evidence note before closing, rechecking or reopening',()=>{
  expect(observatoryValidateTransition('Awaiting Review','Fixed','').valid).toBe(false);
  expect(observatoryValidateTransition('Fixed','Rechecked','works now').valid).toBe(true);
  expect(observatoryValidateTransition('Rechecked','Reopened','').valid).toBe(false);
  expect(observatoryValidateTransition('New','Fixed','reviewed thoroughly').valid).toBe(false);
 });
 it('requires actual and expected observations and valid HTTPS links',()=>{
  expect(observatoryValidateIssue(base).valid).toBe(true);
  expect(observatoryValidateIssue({...base,observed:''}).valid).toBe(false);
  expect(observatoryValidateIssue({...base,expected:''}).valid).toBe(false);
  expect(observatoryValidateIssue({...base,source_url:'http://example.com'}).valid).toBe(false);
  expect(observatoryValidateIssue({...base,source_url:'https://example.com'}).valid).toBe(true);
 });
 it('prefills draft information without creating a saved issue',()=>{
  const candidate={id:'member:abc:missing-fandom',workTitle:'Chapter of the Sky',
   title:'Missing fandom tag',expected:'Fandom lookup',observed:'Not independently tested'};
  const draft=observatoryFindingDraft(candidate);
  expect(draft.finding_key).toBe(candidate.id);
  expect(draft.title).toBe(candidate.title);
  expect(draft.severity).toBe('Medium');
  expect(draft.status).toBeUndefined();
 });
 it('only accepts private screenshot formats within six megabytes',()=>{
  const img={type:'image/png',size:1024,name:'example.png'};
  expect(observatoryValidateScreenshot(img)).toEqual({valid:true,extension:'png'});
  expect(observatoryValidateScreenshot({...img,type:'image/svg+xml'}).valid).toBe(false);
  expect(observatoryValidateScreenshot({...img,size:6*1024*1024+1}).valid).toBe(false);
  expect(observatoryValidateScreenshot(null).valid).toBe(false);
 });
});
