import {describe,it,expect,vi} from 'vitest';
import {createManuscriptSaveCoordinator} from './manuscriptSaveCoordinator';

describe('manuscript save coordinator',()=>{
 it('serializes writes even when the first network request is slower',async()=>{
  const order=[];
  let releaseFirst;
  const writer=vi.fn(async(id,draft)=>{
   order.push('start:'+draft.title);
   if(draft.title==='first')await new Promise(resolve=>releaseFirst=resolve);
   order.push('end:'+draft.title);
   return draft;
  });
  const queue=createManuscriptSaveCoordinator(writer);
  const firstVersion=queue.markChanged('chapter-1');
  const first=queue.persist('chapter-1',{title:'first'},firstVersion);
  await Promise.resolve();await Promise.resolve();
  const secondVersion=queue.markChanged('chapter-1');
  const second=queue.persist('chapter-1',{title:'second'},secondVersion);
  releaseFirst();
  const early=await first;
  const latest=await second;
  expect(early.isCurrent).toBe(false);
  expect(latest.isCurrent).toBe(true);
  expect(order).toEqual(['start:first','end:first','start:second','end:second']);
 });
 it('preserves newer local edits while an earlier autosave is pending',async()=>{
  let release;
  const queue=createManuscriptSaveCoordinator(async()=>new Promise(resolve=>release=resolve));
  const v=queue.markChanged('chapter');
  const p=queue.persist('chapter',{body_html:'old'},v);
  await Promise.resolve();await Promise.resolve();
  queue.markChanged('chapter');
  release({body_html:'old'});
  expect((await p).isCurrent).toBe(false);
 });
 it('only considers the latest successful cloud revision safe',async()=>{
  let releaseFirst,releaseSecond;
  const send=vi.fn()
   .mockImplementationOnce(()=>new Promise(resolve=>releaseFirst=resolve))
   .mockImplementationOnce(()=>new Promise(resolve=>releaseSecond=resolve));
  const queue=createManuscriptSaveCoordinator(send);
  expect(queue.hasUnsavedChanges()).toBe(false);
  const old=queue.markChanged('chapter-A');
  const first=queue.persist('chapter-A',{body_html:'first'},old);
  await Promise.resolve();await Promise.resolve();
  expect(queue.isSaving('chapter-A')).toBe(true);
  const latest=queue.markChanged('chapter-A');
  const second=queue.persist('chapter-A',{body_html:'second'},latest);
  releaseFirst({id:'chapter-A'});
  expect((await first).isCurrent).toBe(false);
  expect(queue.isDirty('chapter-A')).toBe(true);
  await Promise.resolve();await Promise.resolve();
  releaseSecond({id:'chapter-A'});
  expect((await second).isCurrent).toBe(true);
  expect(queue.isDirty('chapter-A')).toBe(false);
  expect(queue.hasUnsavedChanges()).toBe(false);
  expect(queue.isSaving('chapter-A')).toBe(false);
 });
 it('keeps unsaved edits flagged after a network error and clears them after retry',async()=>{
  const send=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({id:'chapter-A'});
  const queue=createManuscriptSaveCoordinator(send);
  const first=queue.markChanged('chapter-A');
  await expect(queue.persist('chapter-A',{body_html:'draft'},first)).rejects.toThrow('offline');
  expect(queue.isSaving('chapter-A')).toBe(false);
  expect(queue.hasUnsavedChanges()).toBe(true);
  const second=queue.markChanged('chapter-A');
  await queue.persist('chapter-A',{body_html:'draft'},second);
  expect(queue.hasUnsavedChanges()).toBe(false);
 });
 it('tracks saved and unsaved chapters independently',async()=>{
  const queue=createManuscriptSaveCoordinator(async(id)=>({id}));
  await queue.persist('A',{},queue.markChanged('A'));
  queue.markChanged('B');
  expect(queue.isDirty('A')).toBe(false);
  expect(queue.isDirty('B')).toBe(true);
  expect(queue.hasUnsavedChanges()).toBe(true);
 });
 it('allows a second attempt after a failed cloud save',async()=>{
  const writer=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ok:true});
  const queue=createManuscriptSaveCoordinator(writer);
  await expect(queue.persist('x',{},queue.markChanged('x'))).rejects.toThrow('offline');
  const next=await queue.persist('x',{},queue.markChanged('x'));
  expect(next).toEqual({saved:{ok:true},revision:2,isCurrent:true});
 });
});
