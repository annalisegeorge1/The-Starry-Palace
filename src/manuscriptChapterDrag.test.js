import {describe,it,expect} from 'vitest';
import {moveManuscriptChapter,isManuscriptDragAvailable} from './manuscriptChapterDrag';
const chapters=[{id:'a',title:'First'},{id:'b',title:'Second'},{id:'c',title:'Third'},{id:'d',title:'Fourth'}];
describe('manuscript chapter drag and drop',()=>{
 it('moves a chapter before and after another without altering input',()=>{
  expect(moveManuscriptChapter(chapters,'d','b').map(x=>x.id)).toEqual(['a','d','b','c']);
  expect(moveManuscriptChapter(chapters,'a','c',true).map(x=>x.id)).toEqual(['b','c','a','d']);
  expect(chapters.map(x=>x.id)).toEqual(['a','b','c','d']);
 });
 it('refuses unknown, self, duplicate and redundant drops',()=>{
  expect(moveManuscriptChapter(chapters,'a','a')).toBeNull();
  expect(moveManuscriptChapter(chapters,'x','a')).toBeNull();
  expect(moveManuscriptChapter(chapters,'a','b')).toBeNull();
  expect(moveManuscriptChapter([{id:'a'},{id:'a'}],'a','a')).toBeNull();
 });
 it('allows only owner, unfiltered, idle ordering',()=>{
  expect(isManuscriptDragAvailable({isOwner:true,chapterCount:3})).toBe(true);
  expect(isManuscriptDragAvailable({isOwner:false,chapterCount:3})).toBe(false);
  expect(isManuscriptDragAvailable({isOwner:true,filtersActive:true,chapterCount:3})).toBe(false);
  expect(isManuscriptDragAvailable({isOwner:true,busy:true,chapterCount:3})).toBe(false);
 });
});
