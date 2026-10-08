import {describe,it,expect} from 'vitest';
import {chooseWritingResumeTarget,resumeWritingPath} from './writingReturnModel';
const a={id:'a',slug:'first-story',title:'First Story',updated_at:'2026-10-01T14:00:00Z',chapters:[
 {id:'one',title:'Chapter 1',position:1,status:'published',updated_at:'2026-09-27T14:00:00Z'},
 {id:'two',title:'Chapter 2',position:2,status:'draft',updated_at:'2026-10-05T14:00:00Z'}
]};
const b={id:'b',slug:'second-story',title:'Second Story',updated_at:'2026-10-04T14:00:00Z',chapters:[
 {id:'intro',position:1,status:'draft',updated_at:'2026-10-02T14:00:00Z'}
]};
describe('return to writing',()=>{
 it('chooses last edited private chapter, not chapter one',()=>{
  const result=chooseWritingResumeTarget([a,b]);
  expect(result.work.id).toBe('a');
  expect(result.chapter.id).toBe('two');
  expect(resumeWritingPath(result)).toBe('/writing/first-story?chapter=two');
 });
 it('opens a work with no chapters so the existing desk can create one',()=>{
  const work={id:'c',slug:'empty',updated_at:'2026-10-06T10:00:00Z',chapters:[]};
  const result=chooseWritingResumeTarget([work]);
  expect(result.chapter).toBeNull();
  expect(resumeWritingPath(result)).toBe('/writing/empty');
 });
 it('prefers a private draft within the selected work',()=>{
  const work={...a,chapters:[{id:'public',position:3,status:'published',updated_at:'2026-10-07T17:00:00Z'},{id:'private',position:4,status:'draft',updated_at:'2026-10-05T17:00:00Z'}]};
  expect(chooseWritingResumeTarget([work]).chapter.id).toBe('private');
 });
 it('has a safe fallback for no works and invalid timestamps',()=>{
  expect(chooseWritingResumeTarget([])).toBeNull();
  expect(resumeWritingPath(null)).toBe('/writing');
  expect(chooseWritingResumeTarget([{id:'a',slug:'a',updated_at:'bad',chapters:[{id:'1',position:1,status:'draft'}]}]).chapter.id).toBe('1');
 });
});
