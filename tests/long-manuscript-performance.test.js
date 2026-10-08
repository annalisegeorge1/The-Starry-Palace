import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const studio=live.split('export function WorkStudioLive(')[1]?.split('export function ')[0]||'';
const css=readFileSync(resolve(process.cwd(),'src/manuscript-calm-focus.css'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('long chapter editing stays responsive and recoverable',()=>{
 it('does not stringify or write full chapter HTML synchronously on every keystroke',()=>{
  const queue=studio.split('function queueSave(form)')[1]?.split('async function quickSaveChapter')[0]||'';
  expect(queue).toContain('markChanged(chapter.id)');
  expect(queue).toContain('recoverySchedulerRef.current?.schedule()');
  expect(queue).not.toContain('snapshotDraft(form)');
  expect(queue).not.toContain('localStorage.setItem');
 });
 it('keeps cloud autosave, revision ordering, and local emergency copies',()=>{
  expect(studio).toContain('createManuscriptSaveCoordinator(');
  expect(studio).toContain('saveCoordinatorRef.current.persist(chapterId,');
  expect(studio).toContain('localStorage.setItem(recoveryKey(),JSON.stringify(snap))');
  expect(studio).toContain('recoverySchedulerRef.current?.cancel()');
  expect(studio).toContain('recoverySchedulerRef.current?.flush()');
  expect(studio).toContain("createDraftRecoveryScheduler(()=>recoveryWriteRef.current?.(),320,1800)");
  expect(studio).toContain("window.addEventListener('pagehide',flushRecovery)");
  expect(studio).toContain("if(document.visibilityState==='hidden')flushRecovery()");
  expect(studio).toContain("onBlur={()=>recoverySchedulerRef.current?.flush()}");
  expect(studio).toContain('function switchChapterSafely(nextId)');
 });
 it('avoids scroll animation stacking for typewriter mode',()=>{
  expect(studio).toContain('typewriterScrollFrameRef.current=window.requestAnimationFrame(');
  expect(studio).toContain("window.scrollBy({top:rect.top-target,behavior:'auto'})");
  expect(studio).toContain('window.cancelAnimationFrame(typewriterScrollFrameRef.current)');
 });
 it('keeps long chapters readable and the styling appropriate on mobile',()=>{
  expect(css).toContain('text-wrap:wrap!important');
  expect(css).toContain('.manuscript-sheet-heading');
  expect(css).toContain('@media(max-width:760px)');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(main).toContain("import './manuscript-calm-focus.css';");
 });
});
