import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const live=readFileSync(new URL('../src/liveRooms.jsx',import.meta.url),'utf8');
const reader=live.split('export function ChapterLive(')[1]?.split('export function ')[0]||'';
const writer=live.split('export function WritingLive(')[1]?.split('export function ')[0]||'';
const data=readFileSync(new URL('../src/palaceData.js',import.meta.url),'utf8');

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
 it('offers explicit chapter wayfinding without extra overlays',()=>{
  expect(reader).toContain('id="palace-reader-start"');
  expect(reader).toContain('id="palace-reader-chapters"');
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
