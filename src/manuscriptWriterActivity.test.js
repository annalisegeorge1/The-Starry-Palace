import {describe,it,expect} from 'vitest';
import {manuscriptRecentActivity,manuscriptDraftReadiness} from './manuscriptWriterActivity';
describe('writer dashboard recent work',()=>{
 it('uses actual timestamps and does not invent a writing streak',()=>{
  const events=manuscriptRecentActivity([
   {id:'a',title:'Earlier',updated_at:'2026-10-20T10:00:00Z'},
   {id:'b',title:'Latest',updated_at:'2026-10-22T10:00:00Z'},
   {id:'c',title:'Unknown'}
  ]);
  expect(events.map(x=>x.title)).toEqual(['Latest','Earlier']);
  expect(events).toHaveLength(2);
 });
 it('distinguishes drafted text from published chapters',()=>{
  expect(manuscriptDraftReadiness([{status:'draft',word_count:250},{status:'draft',word_count:0},{status:'published',word_count:500}]))
   .toEqual({drafts:2,withWords:1});
 });
});
