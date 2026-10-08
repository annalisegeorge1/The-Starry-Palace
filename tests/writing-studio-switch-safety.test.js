import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const studio=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8').split('export function WorkStudioLive(')[1]?.split('export function ')[0]||'';

describe('writing desk selection and cloud status protection',()=>{
 it('loads only the currently selected chapter through the cancellable loader',()=>{
  expect(studio).toContain('return loadSelectedManuscript({');
  expect(studio).toContain('chapterId:selected');
  expect(studio).toContain('loadChapter:id=>getChapter(slug,id)');
  expect(studio).toContain('loadRevisions:id=>getChapterSnapshots(id)');
  expect(studio).toContain('setChapter(ch);');
  expect(studio).toContain('setRecovery(snap);');
  expect(studio).toContain("setChapter(null);setSnapshots([]);setRecovery(null);setChapterMap([])");
 });
 it('does not confuse a new chapter with the settings form while it loads',()=>{
  expect(studio).toContain("selected&&chapter?.id!==selected?<section className=\"palace-chapter-opening\"");
  expect(studio).toContain('role="status"');
 });
 it('never lets stale saves claim that another chapter is saved',()=>{
  expect(studio).toContain('if(isCurrent){');
  expect(studio).toContain('if(selectedRef.current===chapterId){');
  expect(studio).toContain('setSaved(\'Saved to Palace\');');
  expect(studio).toContain('if(selectedRef.current===chapterId){\n   setSaved(\'New edits waiting to save…\');');
 });
 it('continues to retain on-device recovery during slow and failed cloud saves',()=>{
  expect(studio).toContain("localStorage.setItem(recoveryKey(),JSON.stringify(snap))");
  expect(studio).toContain("setSaved('Recovery copy kept on this device')");
  expect(studio).toContain('restoreRecovery()');
 });
});
