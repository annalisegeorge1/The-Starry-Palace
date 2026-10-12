import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const live=readFileSync('src/liveRooms.jsx','utf8');
const tagSection=live.split('export function TagSearchLive({Frame})')[1].split('export function WorkLive({Frame})')[0];
describe('full archive tag searches',()=>{
 it('uses server totals and pagination',()=>{
  expect(tagSection).toContain('searchPublishedArchive({text:needle');
  expect(tagSection).toContain('setResultCount(response.total)');
  expect(tagSection).toContain('limit:20,offset:page*20');
  expect(tagSection).toContain('<ReadingArchivePager page={resultsPage}');
 });
 it('keeps published results rich and filterable',()=>{
  expect(tagSection).toContain('<ReadingStoryContext work={w}');
  expect(tagSection).toContain('<ReadingStoryStats work={w}');
  expect(tagSection).toContain('resultCount===0');
  expect(tagSection).toContain('to={tagWorldPath(tag)||');
 });
});
