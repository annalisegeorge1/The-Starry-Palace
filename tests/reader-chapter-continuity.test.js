import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const reader=live.slice(live.indexOf('export function ChapterLive({Frame})'),live.indexOf('function palaceLocalDateTimeValue'));

describe('reader chapter identity and private notes',()=>{
 it('isolates reader state by member, work and chapter',()=>{
  expect(reader).toContain("export function ChapterLive({Frame})");
  expect(reader).toContain("function ReaderChapter({Frame,slug,chapterId})");
  expect(reader).toContain("key={(session?.user?.id||'guest')+':'+slug+':'+chapterId}");
  expect(reader).toContain("getChapter(slug,chapterId)");
 });
 it('keeps unfinished reader notes on this tab and inside the correct chapter',()=>{
  expect(reader).toContain("readReaderNoteDraft(window.sessionStorage,session?.user?.id,chapterId).body");
  expect(reader).toContain("readReaderNoteDraft(window.sessionStorage,session?.user?.id,chapterId).label");
  expect(reader).toContain("writeReaderNoteDraft(window.sessionStorage,session?.user?.id,chapterId,{body:noteBody,label:noteLabel})");
  expect(reader).toContain("writeReaderNoteDraft(window.sessionStorage,session.user.id,data.chapter.id,{body:'',label:''})");
  expect(reader).toContain('Draft kept in this tab');
 });
 it('does not pretend to award completion to guests',()=>{
  expect(reader).toContain("Sign in to track completion ✦");
  expect(reader).toContain("encodeURIComponent('/work/'+slug+'/chapter/'+chapterId)");
  expect(reader).toContain('Mark work finished ✦');
 });
});
