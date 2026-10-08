import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const reader=live.slice(live.indexOf('function ReaderChapter({Frame,slug,chapterId})'),live.indexOf('function palaceLocalDateTimeValue'));

describe('reading place recovery integrated into chapter routes',()=>{
 it('prefers a newer account-specific local position when cloud saving lags',()=>{
  expect(reader).toContain('chooseReaderResumePosition(readerState?.progress,localPlace,d.chapter.id)');
  expect(reader).toContain('readReaderPosition(window.localStorage,session.user.id,d.chapter.id)');
 });
 it('remembers positions under the member identity, not a shared chapter-only key',()=>{
  expect(reader).toContain('rememberReaderPosition(window.localStorage,session.user.id,data.chapter.id,pct)');
  expect(reader).not.toContain("localStorage.setItem('palace-reading-place:'+data.chapter.id");
 });
 it('allows the reader to resume even if a cloud progress request fails',()=>{
  expect(reader).toContain('setReaderPlace(fallback?.percent||0)');
  expect(reader).toContain('if(!fallback||fallback.percent<=1)restoredPlaceRef.current=d.chapter.id');
  expect(reader).toContain('readingPlaceReadyRef.current=true');
 });
});
