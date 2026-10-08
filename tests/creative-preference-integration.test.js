import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const reader=live.slice(live.indexOf('function ReaderChapter({Frame,slug,chapterId})'),live.indexOf('function palaceLocalDateTimeValue'));
const writer=live.slice(live.indexOf('function WorkStudioForWork({Frame,slug})'),live.indexOf('export function CodeLive({Frame})'));
describe('safe reader and manuscript preferences',()=>{
 it('does not rely on unrestricted browser storage to open a chapter',()=>{
  expect(reader).toContain("readPalaceNumber('palace-reader-font',20,16,28)");
  expect(reader).toContain("readPalaceChoice('palace-reader-tone',['palace','paper','soft'],'palace')");
  expect(reader).toContain("writePalacePreference('palace-reader-font',n)");
  expect(reader).toContain("removePalacePreference(key)");
 });
 it('preserves valid writing typography while bounding stale values',()=>{
  expect(writer).toContain("readPalaceNumber('palace-writer-font-size',20,16,30)");
  expect(writer).toContain("readPalaceChoice('palace-writer-font',['serif','sans','mono','accessible'],'serif')");
  expect(writer).toContain("readPalaceChoice('palace-sprint-minutes',['10','15','25','45','60'],'25')");
  expect(writer).toContain("readPalaceChoice('palace-desk-mood',['moonlit','ink','paper'],'moonlit')");
 });
});
