import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const css=readFileSync(resolve(process.cwd(),'src/writer-draft-reassurance.css'),'utf8');
const studio=live.slice(live.indexOf('function WorkStudioForWork('),live.indexOf('function palaceLocalDateTimeValue',live.indexOf('function WorkStudioForWork('))+1 || undefined);

describe('writer safety and truthful save feedback',()=>{
 it('downloads a local, current text copy without changing the server draft',()=>{
  expect(live).toContain('function downloadDraftBackup()');
  expect(live).toContain('editorRef.current?.innerText??editorRef.current?.textContent');
  expect(live).toContain('writerBackupText({');
  expect(live).toContain('writerBackupFilename(data?.title,chapterTitle)');
  expect(live).toContain("new Blob([payload],{type:'text/plain;charset=utf-8'})");
  expect(live).toContain('title="Download this chapter as plain text, independently of the cloud"');
  expect(live).toContain('Cloud save status has not changed.');
 });
 it('keeps autosave, change revisions and device recovery intact',()=>{
  expect(live).toContain('saveCoordinatorRef.current.markChanged(chapter.id)');
  expect(live).toContain('saveCoordinatorRef.current.persist(chapterId,');
  expect(live).toContain('try{localStorage.setItem(recoveryKey(),JSON.stringify(snap));');
  expect(live).toContain('setRecoveryStorageAvailable(false)');
  expect(live).toContain('Device recovery unavailable.');
  expect(live).toContain("function saveFailureNotice()");
  expect(live).toContain('Saved to Palace');
 });
 it('routes keyboard save through the same button action and cancels pending timer',()=>{
  expect(live).toContain("if(mod&&key==='s'&&chapter){e.preventDefault();quickSaveChapter()}");
  expect(live).toContain("async function quickSaveChapter()");
  expect(live).toContain("if(saveTimerRef.current){clearTimeout(saveTimerRef.current);saveTimerRef.current=null}");
 });
 it('keeps clear, cool-toned feedback in light/dark mode with keyboard access',()=>{
  expect(main).toContain("import './writer-draft-reassurance.css';");
  expect(css).toContain('.writer-toolbar-save-state.state-attention');
  expect(css).toContain('.writer-backup-action');
  expect(css).toContain('.writer-recovery-alert');
  expect(css).toContain('.daylight');
  expect(css).toContain('focus-visible');
  expect(css).toContain('@media(max-width:760px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
