import {afterEach,describe,expect,it,vi} from 'vitest';
import {createManuscriptSaveCoordinator} from './manuscriptSaveCoordinator';
import {stageManuscriptRestore} from './manuscriptRestoreStage';
import {createChapterSwitchGate} from './editorFlow';
import {createDraftRecoveryScheduler} from './draftRecoveryScheduler';
import {shouldWarnOnWriterLink} from './manuscriptNavigationGuard';

/**
 * These deliberately combine existing helpers rather than simulating the
 * signed-in editor. They protect the most important safety invariants while
 * the Cloudflare Pages preview has no configured sign-in.
 */
describe('writer safety across delayed saves, recovery and navigation',()=>{
 afterEach(()=>vi.useRealTimers());

 it('keeps a restored draft dirty when an older in-flight cloud save succeeds',async()=>{
  const requests=[];
  const coordinator=createManuscriptSaveCoordinator((chapterId,payload)=>
   new Promise(resolve=>requests.push({chapterId,payload,resolve})));
  const chapterId='chapter-42';
  const staleRevision=coordinator.markChanged(chapterId);
  const oldSave=coordinator.persist(chapterId,{body_html:'<p>Old draft</p>'},staleRevision);
  await Promise.resolve();
  await Promise.resolve();
  expect(requests).toHaveLength(1);

  const storage=new Map();
  const restored=stageManuscriptRestore({
   chapterId,
   draft:{title:'Moonlit chapter',body_html:'<p>Restored and longer</p>',revision_note:'Recovery'},
   savedAt:'2026-10-14T00:00:00.000Z',
   storage:{setItem:(key,value)=>storage.set(key,value)},
   markChanged:id=>coordinator.markChanged(id)
  });
  expect(restored.stored).toBe(true);
  expect(restored.revision).toBeGreaterThan(staleRevision);
  expect(JSON.parse(storage.get('palace-recovery:'+chapterId)).body_html)
   .toBe('<p>Restored and longer</p>');

  const latestSave=coordinator.persist(chapterId,restored.draft,restored.revision);
  requests[0].resolve({id:chapterId,body_html:'<p>Old draft</p>'});
  expect((await oldSave).isCurrent).toBe(false);
  expect(coordinator.isDirty(chapterId)).toBe(true);
  expect(coordinator.hasUnsavedChanges()).toBe(true);
  expect(storage.has('palace-recovery:'+chapterId)).toBe(true);

  await Promise.resolve();
  await Promise.resolve();
  expect(requests).toHaveLength(2);
  expect(requests[1].payload.body_html).toBe(restored.draft.body_html);
  requests[1].resolve({id:chapterId,body_html:restored.draft.body_html});
  const latest=await latestSave;
  expect(latest.isCurrent).toBe(true);
  expect(coordinator.isDirty(chapterId)).toBe(false);
  // The coordinator cannot discard a recovery copy on its own; the writing
  // room removes it only after verifying its own current cloud response.
  expect(storage.has('palace-recovery:'+chapterId)).toBe(true);
 });

 it('never treats a failed cloud write as safe when switching chapters',async()=>{
  const network=vi.fn()
   .mockRejectedValueOnce(new Error('offline'))
   .mockResolvedValueOnce({id:'chapter-A'});
  const coordinator=createManuscriptSaveCoordinator(network);
  const switchGate=createChapterSwitchGate();
  const chapterA='chapter-A';
  const revision=coordinator.markChanged(chapterA);
  const request=switchGate.begin();
  await expect(coordinator.persist(chapterA,{body_html:'<p>Keep me</p>'},revision))
   .rejects.toThrow('offline');
  expect(switchGate.isCurrent(request)).toBe(true);
  expect(coordinator.isDirty(chapterA)).toBe(true);
  expect(shouldWarnOnWriterLink({
   currentUrl:'https://palace.example/studio/a?chapter=chapter-A',
   href:'/writing',dirty:coordinator.hasUnsavedChanges()
  })).toBe(true);

  await coordinator.persist(chapterA,{body_html:'<p>Keep me</p>'},revision);
  expect(coordinator.isDirty(chapterA)).toBe(false);
  expect(shouldWarnOnWriterLink({
   currentUrl:'https://palace.example/studio/a?chapter=chapter-A',
   href:'/writing',dirty:coordinator.hasUnsavedChanges()
  })).toBe(false);
 });

 it('ignores the oldest chapter-switch intent during a slow save',async()=>{
  let release;
  const coordinator=createManuscriptSaveCoordinator(()=>
   new Promise(resolve=>{release=resolve}));
  const gate=createChapterSwitchGate();
  const revision=coordinator.markChanged('chapter-A');
  const firstIntent=gate.begin();
  const save=coordinator.persist('chapter-A',{body_html:'<p>Scene</p>'},revision);
  await Promise.resolve();
  await Promise.resolve();
  const latestIntent=gate.begin();
  expect(gate.isCurrent(firstIntent)).toBe(false);
  expect(gate.isCurrent(latestIntent)).toBe(true);
  release({id:'chapter-A'});
  expect((await save).isCurrent).toBe(true);
  // The save is valid, but completion of the older navigation request must
  // not decide which chapter the user has selected in the meantime.
  expect(gate.isCurrent(firstIntent)).toBe(false);
  expect(gate.isCurrent(latestIntent)).toBe(true);
 });

 it('does not make a device recovery snapshot count as an additional edit',()=>{
  vi.useFakeTimers();
  const coordinator=createManuscriptSaveCoordinator(async()=>({id:'chapter-Z'}));
  const chapterId='chapter-Z';
  const revision=coordinator.markChanged(chapterId);
  const revisions=[];
  const scheduler=createDraftRecoveryScheduler(
   ()=>revisions.push(coordinator.currentRevision(chapterId)),320,1800);
  for(let i=0;i<10;i++){scheduler.schedule();vi.advanceTimersByTime(50)}
  vi.advanceTimersByTime(321);
  expect(revisions).toEqual([revision]);
  expect(coordinator.currentRevision(chapterId)).toBe(revision);
  expect(coordinator.isDirty(chapterId)).toBe(true);
  scheduler.cancel();
 });
});
