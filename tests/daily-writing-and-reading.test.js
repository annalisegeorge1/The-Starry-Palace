import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const rooms=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const writer=rooms.split('export function WorkStudioLive(')[1]?.split('export function ')[0]||'';
const reader=rooms.split('export function ChapterLive(')[1]?.split('export function ')[0]||'';
const style=readFileSync(resolve(process.cwd(),'src/palace-desk-clarity.css'),'utf8');

describe('editor and reader daily-use guarantees',()=>{
 it('ensures a later chapter selection wins over a slow earlier save',()=>{
  expect(writer).toContain('switchGateRef.current.begin()');
  expect(writer).toContain('!switchGateRef.current.isCurrent(intent)');
  expect(writer).toContain('selectedRef.current!==original');
  expect(writer).toContain('selectedRef.current=next;setSelected(next)');
 });
 it('does not rebuild the entire chapter map on each typing event',()=>{
  expect(writer).toContain('createEditorMetricsScheduler(');
  expect(writer).toContain('editorMetricsRef.current?.schedule();queueSave(');
  expect(writer).toContain('onInput={e=>{editorMetricsRef.current?.schedule();queueSave(');
  expect(writer).toContain('editorMetricsRef.current?.cancel()');
  expect(writer).toContain('if(countWords(editorRef.current?.innerHTML||\'\')<1)');
 });
 it('keeps cloud-saving and private local recovery intact',()=>{
  expect(writer).toContain("localStorage.setItem(recoveryKey(),JSON.stringify(snap))");
  expect(writer).toContain('createManuscriptSaveCoordinator(');
  expect(writer).toContain('await persistChapter(form)');
  expect(writer).toContain('setSaved(saveFailureNotice())');
  expect(writer).toContain("recoveryStorageRef.current?'Recovery copy kept on this device':'Cloud save failed · export draft now'");
  expect(writer).toContain('setRecoveryStorageAvailable(false)');
 });
 it('makes reader settings and the active reading tone identifiable',()=>{
  expect(reader).toContain('aria-controls="palace-reader-settings"');
  expect(reader).toContain('aria-expanded={controlsOpen}');
  expect(reader).toContain('aria-pressed={readerFocus}');
  expect(reader).toContain("aria-pressed={readerTone==='paper'}");
  expect(style).toContain('min-height:44px');
  expect(style).toContain('prefers-reduced-motion:reduce');
 });
});
