import {describe,it,expect} from 'vitest';
import {classicChapterChoices,classicNumericPage,CLASSIC_NUMERIC_PAGE_THRESHOLD} from './classicNavigatorModel';
describe('Large classic editions use lightweight, direct navigation',()=>{
 const contents=Array.from({length:1400},(_,i)=>({sourceIndex:i*40,title:'Chapter '+(i+1)+' — A long title',pageIndex:i*3}));
 it('keeps first chapters within a small menu instead of mounting thousands of options',()=>{
  const result=classicChapterChoices(contents);
  expect(result.total).toBe(1400);
  expect(result.items.length).toBeLessThanOrEqual(72);
  expect(result.hasMore).toBe(true);
  expect(result.items[0].title).toContain('Chapter 1 ');
 });
 it('searches every chapter even those beyond initial list',()=>{
  const result=classicChapterChoices(contents,'Chapter 1399');
  expect(result.items.some(x=>x.title.startsWith('Chapter 1399 '))).toBe(true);
  expect(result.matched).toBe(1);
 });
 it('keeps the reader’s current selection available while searching elsewhere',()=>{
  const result=classicChapterChoices(contents,'Chapter 11',contents[1300].sourceIndex);
  expect(result.items.some(x=>x.sourceIndex===contents[1300].sourceIndex)).toBe(true);
  expect(new Set(result.items.map(x=>x.sourceIndex)).size).toBe(result.items.length);
 });
 it('never mutates the input chapter directory',()=>{
  const before=contents.length;
  classicChapterChoices(contents,'');
  expect(contents.length).toBe(before);
  expect(contents[0].title).toBe('Chapter 1 — A long title');
 });
 it('validates a typed reading page without silently jumping on empty or wrong numbers',()=>{
  expect(CLASSIC_NUMERIC_PAGE_THRESHOLD).toBe(80);
  expect(classicNumericPage('1',700)).toBe(0);
  expect(classicNumericPage('700',700)).toBe(699);
  for(const v of ['',0,'0','-1','99999','2.5','hello','Infinity'])expect(classicNumericPage(v,700)).toBeNull();
  expect(classicNumericPage('40',0)).toBeNull();
 });
});
