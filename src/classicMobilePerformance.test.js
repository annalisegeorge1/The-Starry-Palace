import {describe,it,expect,vi,afterEach} from 'vitest';
import {prepareClassicReading,CLASSIC_BACKGROUND_PARSE_THRESHOLD} from './classicReadingPreparation';
import {loadClassicReading} from './classicBackgroundLoader';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

afterEach(()=>vi.useRealTimers());

describe('Classic books on slower mobile devices',()=>{
 const text='CONTENTS\n\nCHAPTER I\n\nCHAPTER I\n\n'+('The night was calm, and the old house stood at the edge of the village. '.repeat(7));
 it('prepares a display edition with every source paragraph and actual chapter intact',()=>{
  const original=prepareClassicReading(text);
  expect(original.pages.length).toBeGreaterThan(0);
  expect(original.storyPage).toBeGreaterThan(0);
  expect(original.pages[original.storyPage][0].text).toBe('CHAPTER I');
  expect(original.contents.map(x=>x.title)).toEqual(['CHAPTER I']);
  expect(original.pages.flat().map(x=>x.text)).toEqual([
   'CONTENTS','CHAPTER I','CHAPTER I',('The night was calm, and the old house stood at the edge of the village. '.repeat(7)).trim()
  ]);
 });
 it('supports a rapid close before a smaller book finishes preparing',()=>{
  vi.useFakeTimers();
  const ready=vi.fn(),error=vi.fn();
  const cancel=loadClassicReading('CHAPTER I\n\nShort story.',ready,error);
  expect(ready).not.toHaveBeenCalled();
  cancel();
  vi.runAllTimers();
  expect(ready).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
 });
 it('prepares short excerpts without creating a worker',()=>{
  vi.useFakeTimers();
  const ready=vi.fn(),error=vi.fn(),makeWorker=vi.fn();
  const cancel=loadClassicReading('CHAPTER I\n\nA short excerpt.',ready,error,makeWorker);
  vi.runAllTimers();
  expect(ready).toHaveBeenCalledTimes(1);
  expect(ready.mock.calls[0][0].pages[0][0].text).toBe('CHAPTER I');
  expect(makeWorker).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  cancel();
 });
 it('sends huge novels off the UI thread, then terminates the worker',()=>{
  const worker={postMessage:vi.fn(),terminate:vi.fn(),onmessage:null,onerror:null};
  const ready=vi.fn(),error=vi.fn();
  const payload='x'.repeat(CLASSIC_BACKGROUND_PARSE_THRESHOLD);
  const cancel=loadClassicReading(payload,ready,error,()=>worker);
  expect(worker.postMessage).toHaveBeenCalledWith(payload);
  expect(ready).not.toHaveBeenCalled();
  worker.onmessage({data:{ok:true,result:{pages:[[{kind:'paragraph',text:'Ready'}]],storyPage:0,contents:[]}}});
  expect(ready).toHaveBeenCalledTimes(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
  cancel();
 });
 it('does not emit a late worker result after edition close or navigation',()=>{
  const worker={postMessage:vi.fn(),terminate:vi.fn(),onmessage:null,onerror:null};
  const ready=vi.fn();
  const cancel=loadClassicReading('x'.repeat(CLASSIC_BACKGROUND_PARSE_THRESHOLD),ready,()=>{},()=>worker);
  const onMessage=worker.onmessage;
  cancel();
  onMessage({data:{ok:true,result:{pages:[]}}});
  expect(ready).not.toHaveBeenCalled();
  expect(worker.terminate).toHaveBeenCalledTimes(1);
 });
 it('preserves responsive controls and source attribution in the prepared reader',()=>{
  const reader=readFileSync(resolve(process.cwd(),'src/ArchiveClassicReader.jsx'),'utf8');
  const css=readFileSync(resolve(process.cwd(),'src/classic-mobile-reader.css'),'utf8');
  const loader=readFileSync(resolve(process.cwd(),'src/classicBackgroundLoader.js'),'utf8');
  expect(reader).toContain('loadClassicReading(text?.body_text');
  expect(reader).toContain('Quick classic reading page navigation');
  expect(reader).toContain('Previous reading page');
  expect(reader).toContain('Next reading page');
  expect(reader).toContain('Your reading page and appearance are remembered');
  expect(reader).toContain('View edition, source and translator details');
  expect(loader).toContain("new Worker(new URL('./classicParsingWorker.js',import.meta.url)");
  expect(css).toContain('position:sticky');
  expect(css).toContain('@media(max-width:720px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});