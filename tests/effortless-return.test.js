import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const reader=live.split('export function ChapterLive(')[1]?.split('export function ')[0]||'';
const writer=live.split('export function WritingLive(')[1]?.split('export function ')[0]||'';
const data=readFileSync(resolve(process.cwd(),'src/palaceData.js'),'utf8');

describe('effortless reading and writing regression protection',()=>{
 it('restores a chapter once, then lets the reader scroll independently',()=>{
  expect(reader).toContain('readingPlaceReadyRef.current=false');
  expect(reader).toContain("const restoreKey=data.chapter.id;");
  expect(reader).not.toContain("const restoreKey=data.chapter.id+':'+Math.round(readerPlace)");
  expect(reader).toContain('if(restoredPlaceRef.current===restoreKey)return;');
  expect(reader).toContain('if(!readingPlaceReadyRef.current||restoredPlaceRef.current!==data.chapter.id)return;');
  expect(reader).toContain('return()=>{active=false}');
  expect(reader).toContain('setData(undefined);setReaderPlace(0);setNotes([])');
 });
 it('avoids re-sanitizing a long chapter and rebuilding landmarks on every scroll event',()=>{
  expect(reader).toContain("const readerHtml=React.useMemo(");
  expect(reader).toContain("const readerLandmarks=React.useMemo(");
  expect(reader).toContain("[readerHtml]);");
  expect(reader).toContain("setReaderPlace(prev=>Math.abs(prev-pct)>=1?pct:prev)");
  expect(reader.indexOf('const readerHtml=React.useMemo(')).toBeLessThan(reader.indexOf('if(data===null)return'));
 });
 it('offers explicit chapter wayfinding without extra overlays',()=>{
  expect(reader).toContain('id="palace-reader-start"');
  expect(reader).toContain('<ReaderChapterShelf chapters={readable} chapterId={chapterId} workSlug={slug}/>');
  const shelf=readFileSync(resolve(process.cwd(),'src/ReaderChapterShelf.jsx'),'utf8');
  expect(shelf).toContain('id="palace-reader-chapters"');
  expect(reader).toContain('Back to chapter start');
  expect(reader).toContain('Chapter list ↓');
 });
 it('opens the writing desk from the last edited chapter',()=>{
  expect(writer).toContain('chooseWritingResumeTarget(works)');
  expect(writer).toContain('openWorkInPad(target.work,target.chapter)');
  expect(writer).toContain('Resume latest draft');
  expect(data).toContain('chapters(id,title,position,status,word_count,scheduled_for,published_at,updated_at)');
 });
});
