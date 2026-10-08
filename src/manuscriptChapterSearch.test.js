import {describe,it,expect} from 'vitest';
import {matchesManuscriptChapter,hasActiveManuscriptFilters} from './manuscriptChapterSearch';
describe('Writing Studio chapter search',()=>{
 const chapter={title:'The House of the Moon',position:12,status:'draft'};
 it('finds titles without case sensitivity',()=>{
  expect(matchesManuscriptChapter(chapter,'house')).toBe(true);
  expect(matchesManuscriptChapter(chapter,'  MOON  ')).toBe(true);
  expect(matchesManuscriptChapter(chapter,'garden')).toBe(false);
 });
 it('finds exact chapter numbers, including #12 and chapter 012',()=>{
  expect(matchesManuscriptChapter(chapter,'#12')).toBe(true);
  expect(matchesManuscriptChapter(chapter,'chapter 012')).toBe(true);
  expect(matchesManuscriptChapter(chapter,'ch.12')).toBe(true);
  expect(matchesManuscriptChapter(chapter,'#2')).toBe(false);
 });
 it('detects when the visible list has a hidden folder or status filter',()=>{
  expect(hasActiveManuscriptFilters()).toBe(false);
  expect(hasActiveManuscriptFilters({folder:'unfiled'})).toBe(true);
  expect(hasActiveManuscriptFilters({status:'draft'})).toBe(true);
  expect(hasActiveManuscriptFilters({query:'  '})).toBe(false);
 });
});
