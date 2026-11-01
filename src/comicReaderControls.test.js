import {describe,it,expect} from 'vitest';
import {comicReaderMode,shouldTurnComicPageWithKey,comicPageTurn} from './comicReaderControls';

describe('Comic reader comfort and navigation',()=>{
 it('uses a safe reader mode if a saved value is stale',()=>{
  expect(comicReaderMode('vertical')).toBe('vertical');
  expect(comicReaderMode('pages')).toBe('pages');
  expect(comicReaderMode('invalid')).toBe('pages');
  expect(comicReaderMode(null)).toBe('pages');
 });
 it('ignores arrows while typing, selecting, or interacting with a dialog',()=>{
  const ordinary={key:'ArrowRight',target:{closest:()=>null,isContentEditable:false}};
  expect(shouldTurnComicPageWithKey(ordinary)).toBe(true);
  expect(shouldTurnComicPageWithKey(ordinary,true)).toBe(false);
  expect(shouldTurnComicPageWithKey({...ordinary,altKey:true})).toBe(false);
  expect(shouldTurnComicPageWithKey({...ordinary,key:'ArrowDown'})).toBe(false);
  expect(shouldTurnComicPageWithKey({...ordinary,target:{closest:()=>({tagName:'INPUT'})}})).toBe(false);
  expect(shouldTurnComicPageWithKey({...ordinary,target:{closest:()=>null,isContentEditable:true}})).toBe(false);
 });
 it('turns LTR and RTL sequences correctly and moves between episodes only at boundaries',()=>{
  expect(comicPageTurn('ArrowRight','ltr',1,3)).toEqual({pageIndex:2});
  expect(comicPageTurn('ArrowLeft','ltr',1,3)).toEqual({pageIndex:0});
  expect(comicPageTurn('ArrowLeft','rtl',1,3)).toEqual({pageIndex:2});
  expect(comicPageTurn('ArrowRight','rtl',1,3)).toEqual({pageIndex:0});
  expect(comicPageTurn('ArrowRight','ltr',2,3,'old','new')).toEqual({episodeId:'new'});
  expect(comicPageTurn('ArrowRight','rtl',0,3,'old','new')).toEqual({episodeId:'old'});
  expect(comicPageTurn('ArrowLeft','rtl',2,3,'old','new')).toEqual({episodeId:'new'});
  expect(comicPageTurn('ArrowLeft','ltr',0,3,'old','new')).toEqual({episodeId:'old'});
  expect(comicPageTurn('ArrowRight','ltr',2,3)).toBeNull();
  expect(comicPageTurn('ArrowRight','ltr',0,0)).toBeNull();
 });
});
