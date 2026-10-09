import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {createDraftRecoveryScheduler} from './draftRecoveryScheduler';
import {createManuscriptSaveCoordinator} from './manuscriptSaveCoordinator';

describe('long-form on-device recovery scheduler',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>vi.useRealTimers());
 it('batches a burst of keystrokes into one recovery copy',()=>{
  const write=vi.fn(),scheduler=createDraftRecoveryScheduler(write,320,1800);
  for(let i=0;i<30;i++){scheduler.schedule();vi.advanceTimersByTime(9)}
  expect(write).not.toHaveBeenCalled();
  expect(scheduler.hasPending()).toBe(true);
  vi.advanceTimersByTime(320);
  expect(write).toHaveBeenCalledOnce();
  expect(scheduler.hasPending()).toBe(false);
  vi.advanceTimersByTime(2500);
  expect(write).toHaveBeenCalledOnce();
 });
 it('writes at the maximum interval even when typing never pauses',()=>{
  const write=vi.fn(),scheduler=createDraftRecoveryScheduler(write,320,1800);
  for(let i=0;i<20;i++){scheduler.schedule();vi.advanceTimersByTime(100)}
  expect(write).toHaveBeenCalledTimes(1);
  expect(scheduler.hasPending()).toBe(true);
  scheduler.flush();
  expect(write).toHaveBeenCalledTimes(2);
  vi.advanceTimersByTime(2000);
  expect(write).toHaveBeenCalledTimes(2);
 });
 it('flushes on blur or pagehide instead of losing recent keystrokes',()=>{
  const write=vi.fn(),scheduler=createDraftRecoveryScheduler(write);
  scheduler.schedule();vi.advanceTimersByTime(100);
  expect(scheduler.flush()).toBe(true);
  expect(write).toHaveBeenCalledOnce();
  expect(scheduler.flush()).toBe(false);
  vi.runAllTimers();
  expect(write).toHaveBeenCalledOnce();
 });
 it('does not invalidate an in-flight save when an ordinary recovery snapshot finishes',async()=>{
  let resolveCloud;
  const queue=createManuscriptSaveCoordinator(()=>new Promise(resolve=>{resolveCloud=resolve}));
  const chapter='chapter-A';
  // The writer typed once. Saving a copy to this device is not another edit.
  const revision=queue.markChanged(chapter);
  const snapshotRevisions=[];
  const scheduler=createDraftRecoveryScheduler(()=>snapshotRevisions.push(queue.currentRevision(chapter)));
  scheduler.schedule();
  const save=queue.persist(chapter,{body_html:'one edit'},revision);
  await Promise.resolve();await Promise.resolve();
  vi.advanceTimersByTime(325);
  expect(snapshotRevisions).toEqual([revision]);
  expect(queue.currentRevision(chapter)).toBe(revision);
  resolveCloud({id:chapter,body_html:'one edit'});
  const result=await save;
  expect(result.isCurrent).toBe(true);
  expect(queue.hasUnsavedChanges()).toBe(false);
  scheduler.cancel();
 });
 it('cancels stale scheduled snapshots after saving or switching chapters',()=>{
  const write=vi.fn(),scheduler=createDraftRecoveryScheduler(write);
  scheduler.schedule();scheduler.cancel();
  vi.runAllTimers();
  expect(write).not.toHaveBeenCalled();
  expect(scheduler.hasPending()).toBe(false);
 });
 it('rejects a missing writer',()=>expect(()=>createDraftRecoveryScheduler(null)).toThrow(TypeError));
});
