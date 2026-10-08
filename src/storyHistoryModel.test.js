import {describe,it,expect} from 'vitest';
import {storyHistoryDetails,storyHistoryLabel} from './storyHistoryModel';
describe('story history metrics',()=>{
 const first='2026-01-01T10:00:00Z',second='2026-02-04T10:00:00Z';
 it('counts published chapters and words, excluding drafts',()=>{
  const x=storyHistoryDetails({},[{status:'published',word_count:1234,published_at:first,title:'One'},{status:'draft',word_count:99},{status:'published',word_count:401,published_at:second,title:'Two'}]);
  expect(x.chapterCount).toBe(2);expect(x.wordCount).toBe(1635);
  expect(storyHistoryLabel(x)).toBe('New chapter published');
  expect(x.chapterTitle).toBe('Two');
 });
 it('labels a real later chapter edit rather than calling it a new chapter',()=>{
  const x=storyHistoryDetails({},[{status:'published',word_count:300,published_at:first,updated_at:'2026-03-02T10:00:00Z',title:'First chapter'}]);
  expect(storyHistoryLabel(x)).toBe('Chapter updated');
 });
 it('does not interpret automatic timestamp drift as an edit',()=>{
  const x=storyHistoryDetails({},[{status:'published',word_count:500,published_at:first,updated_at:'2026-01-01T10:00:03Z'}]);
  expect(storyHistoryLabel(x)).toBe('New chapter published');
 });
 it('avoids inventing changes when the chapter data is unavailable',()=>{
  const x=storyHistoryDetails({last_published_at:second},[]);
  expect(x.chapterCount).toBe(0);expect(x.wordCount).toBe(0);
  expect(storyHistoryLabel(x)).toBe('Latest change not recorded');
 });
});
