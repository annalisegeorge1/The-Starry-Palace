import {describe,expect,it,beforeEach} from 'vitest';
import {readerPositionKey,rememberReaderPosition,readReaderPosition,chooseReaderResumePosition,clampReaderPercent} from './readerPosition';
beforeEach(()=>localStorage.clear());
describe('reader return-position safety',()=>{
 it('only returns positions saved for the same account and chapter',()=>{
  expect(rememberReaderPosition(localStorage,'one','chapter-a',58,1000)).toBe(true);
  expect(readReaderPosition(localStorage,'one','chapter-a',1001)).toEqual({percent:58,updatedAt:1000});
  expect(readReaderPosition(localStorage,'two','chapter-a',1001)).toBe(null);
  expect(readReaderPosition(localStorage,'one','chapter-b',1001)).toBe(null);
 });
 it('uses a newer local place when cloud saving has not caught up',()=>{
  const cloud={chapter_id:'a',chapter_progress_percent:25,updated_at:new Date(1000).toISOString()};
  expect(chooseReaderResumePosition(cloud,{percent:67,updatedAt:3000},'a')).toBe(67);
  expect(chooseReaderResumePosition(cloud,{percent:67,updatedAt:1600},'a')).toBe(25);
  expect(chooseReaderResumePosition(cloud,{percent:90,updatedAt:5000},'b')).toBe(90);
  expect(chooseReaderResumePosition(cloud,null,'a')).toBe(25);
 });
 it('rejects invalid or old local records and clamps out-of-range values',()=>{
  expect(clampReaderPercent(Infinity)).toBe(0);
  expect(clampReaderPercent(-20)).toBe(0);
  expect(clampReaderPercent(500)).toBe(100);
  rememberReaderPosition(localStorage,'reader','chapter',500,10);
  expect(readReaderPosition(localStorage,'reader','chapter',11)?.percent).toBe(100);
  expect(readReaderPosition(localStorage,'reader','chapter',16*24*60*60*1000)).toBe(null);
  localStorage.setItem(readerPositionKey('reader','chapter'),'{broken');
  expect(readReaderPosition(localStorage,'reader','chapter',20)).toBe(null);
 });
 it('treats unavailable storage as optional',()=>{
  const blocked={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  expect(rememberReaderPosition(blocked,'reader','chapter',33)).toBe(false);
  expect(readReaderPosition(blocked,'reader','chapter')).toBe(null);
  expect(rememberReaderPosition(localStorage,null,'chapter',20)).toBe(false);
 });
});
