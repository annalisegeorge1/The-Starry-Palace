import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {orderedReaderChapters,matchReaderChapters,initialReaderChapterPage,readerChapterPage,shouldOpenReaderChapterShelf} from './readerChapterShelfModel';
const chapters=Array.from({length:47},(_,i)=>({id:'ch'+(i+1),position:i+1,title:i===29?'The Falling Star':'Chapter '+(i+1),word_count:800,status:'published'}));
describe('Compact long-work chapter shelf',()=>{
 it('opens directly from the Chapter list anchor, even for long books',()=>{
  expect(shouldOpenReaderChapterShelf(8,'')).toBe(true);
  expect(shouldOpenReaderChapterShelf(47,'')).toBe(false);
  expect(shouldOpenReaderChapterShelf(47,'#palace-reader-chapters')).toBe(true);
 });
 it('orders readable chapters without mutating the input',()=>{
  const scrambled=[chapters[2],chapters[0],chapters[1]];
  expect(orderedReaderChapters(scrambled).map(x=>x.id)).toEqual(['ch1','ch2','ch3']);
  expect(scrambled[0].id).toBe('ch3');
 });
 it('finds titles or exact chapter numbers, not drafts beyond the provided list',()=>{
  expect(matchReaderChapters(chapters,'falling star').map(c=>c.id)).toEqual(['ch30']);
  expect(matchReaderChapters(chapters,'#30').map(c=>c.id)).toEqual(['ch30']);
  expect(matchReaderChapters(chapters,'chapter 7').map(c=>c.id)).toEqual(['ch7']);
  expect(matchReaderChapters(chapters.slice(0,20),'chapter 35')).toEqual([]);
  expect(matchReaderChapters(chapters,'missing')).toEqual([]);
 });
 it('opens the page containing the current chapter and paginates safely',()=>{
  expect(initialReaderChapterPage(chapters,'ch30')).toBe(1);
  expect(initialReaderChapterPage(chapters,'missing')).toBe(0);
  expect(readerChapterPage(chapters,1)).toMatchObject({page:1,pages:3,total:47,start:21,end:40});
  expect(readerChapterPage(chapters,2).items.map(x=>x.id)).toEqual(chapters.slice(40).map(x=>x.id));
  expect(readerChapterPage(chapters,99)).toMatchObject({page:2,start:41,end:47});
  expect(readerChapterPage([],0).items).toEqual([]);
 });
});

const source=readFileSync(resolve(process.cwd(),'src/ReaderChapterShelf.jsx'),'utf8');
describe('Reader chapter anchor wiring',()=>{
 it('opens on repeated link activations and direct hash navigation',()=>{
  expect(source).toContain('onChapterListClick');
  expect(source).toContain("window.addEventListener('hashchange',openFromHash)");
  expect(source).toContain("document.addEventListener('click',onChapterListClick)");
  expect(source).toContain("document.removeEventListener('click',onChapterListClick)");
 });
});
