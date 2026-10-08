import {describe,it,expect} from 'vitest';
import {paginateClassicBlocks,classicContents,clampClassicPage,classicPageKey} from './archiveReaderModel';

describe('full-length classics reader',()=>{
 const paragraph=i=>({kind:'paragraph',text:'Source paragraph '+i});
 it('preserves every block and its order through display pages',()=>{
  const source=Array.from({length:95},(_,i)=>paragraph(i));
  const pages=paginateClassicBlocks(source,24);
  expect(pages.length).toBe(4);
  expect(pages.flat().map(b=>b.text)).toEqual(source.map(b=>b.text));
  expect(pages.flat().map(b=>b.sourceIndex)).toEqual(source.map((_,i)=>i));
 });
 it('moves chapter headings away from orphaned page bottoms',()=>{
  const source=[paragraph(0),paragraph(1),{kind:'heading',text:'CHAPTER II'},paragraph(2),paragraph(3)];
  const pages=paginateClassicBlocks(source,3);
  expect(pages[0].map(b=>b.text)).toEqual(['Source paragraph 0','Source paragraph 1']);
  expect(pages[1][0].text).toBe('CHAPTER II');
  expect(classicContents(pages)).toEqual([{title:'CHAPTER II',pageIndex:1,sourceIndex:2}]);
 });
 it('does not invent headings in editions with no explicit chapter markers',()=>{
  const pages=paginateClassicBlocks([paragraph(0),{kind:'verse',text:'First\\nSecond'}]);
  expect(classicContents(pages)).toEqual([]);
 });
 it('clamps invalid or outdated saved pages safely',()=>{
  expect(clampClassicPage(999,5)).toBe(4);
  expect(clampClassicPage(-2,5)).toBe(0);
  expect(clampClassicPage('bad',5)).toBe(0);
  expect(clampClassicPage(3,0)).toBe(0);
 });
 it('uses per-record device-local position keys',()=>{
  expect(classicPageKey('edition-A')).not.toBe(classicPageKey('edition-B'));
 });
});
