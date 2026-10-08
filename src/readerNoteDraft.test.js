import {describe,it,expect,beforeEach} from 'vitest';
import {emptyReaderNoteDraft,readReaderNoteDraft,writeReaderNoteDraft,readerNoteDraftKey} from './readerNoteDraft';
beforeEach(()=>sessionStorage.clear());
describe('private reading note recovery',()=>{
 it('keeps each member and chapter separate',()=>{
  writeReaderNoteDraft(sessionStorage,'member-1','chapter-a',{body:'Keep this thought',label:'Motif'},100);
  expect(readReaderNoteDraft(sessionStorage,'member-1','chapter-a',101)).toEqual({body:'Keep this thought',label:'Motif'});
  expect(readReaderNoteDraft(sessionStorage,'member-1','chapter-b',101)).toEqual(emptyReaderNoteDraft());
  expect(readReaderNoteDraft(sessionStorage,'member-2','chapter-a',101)).toEqual(emptyReaderNoteDraft());
 });
 it('expires old notes and never promotes broken data into a draft',()=>{
  writeReaderNoteDraft(sessionStorage,'reader','chapter',{body:'Old note'},100);
  expect(readReaderNoteDraft(sessionStorage,'reader','chapter',8*24*60*60*1000)).toEqual(emptyReaderNoteDraft());
  sessionStorage.setItem(readerNoteDraftKey('reader','chapter'),'{broken');
  expect(readReaderNoteDraft(sessionStorage,'reader','chapter',200)).toEqual(emptyReaderNoteDraft());
 });
 it('trims data to field limits and clears after saving the note',()=>{
  writeReaderNoteDraft(sessionStorage,'a','b',{label:'L'.repeat(100),body:'B'.repeat(4500)},100);
  const restored=readReaderNoteDraft(sessionStorage,'a','b',101);
  expect(restored.label).toHaveLength(80);
  expect(restored.body).toHaveLength(4000);
  writeReaderNoteDraft(sessionStorage,'a','b',{label:'',body:''},102);
  expect(readReaderNoteDraft(sessionStorage,'a','b',103)).toEqual(emptyReaderNoteDraft());
 });
 it('handles blocked browser storage and unauthenticated readers gracefully',()=>{
  const bad={getItem(){throw new Error('denied')},setItem(){throw new Error('denied')}};
  expect(readReaderNoteDraft(bad,'a','b')).toEqual(emptyReaderNoteDraft());
  expect(writeReaderNoteDraft(bad,'a','b',{body:'private'})).toBe(false);
  expect(writeReaderNoteDraft(sessionStorage,null,'b',{body:'nothing'})).toBe(false);
 });
});
