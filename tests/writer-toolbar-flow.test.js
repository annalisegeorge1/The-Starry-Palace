import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const studio=live.split('export function WorkStudioLive(')[1]?.split('export function ')[0]||'';
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const css=readFileSync(resolve(process.cwd(),'src/writer-toolbar-flow.css'),'utf8');

describe('writing toolbar flow',()=>{
 it('holds format selection inside the current chapter and restores it after toolbar focus',()=>{
  expect(studio).toContain('formatSelectionRef.current=null');
  expect(studio).toContain('captureEditorSelection(editor,window.getSelection())');
  expect(studio).toContain('restoreEditorSelection(editor,formatSelectionRef.current,window.getSelection())');
  expect(studio).toContain('onPointerDownCapture=');
  expect(studio).toContain('onTouchStartCapture=');
  expect(studio).toContain('onMouseDownCapture=');
  expect(studio).toContain('onInput={e=>{rememberFormattingSelection();editorMetricsRef.current?.schedule()');
 });
 it('avoids unnecessary saves on unsupported formatting commands',()=>{
  expect(studio).toContain('const applied=document.execCommand(command,false,value)');
  expect(studio).toContain("if(applied){editorMetricsRef.current?.schedule();queueSave(editor.closest('form'))}");
  expect(studio).toContain('createManuscriptSaveCoordinator(');
  expect(studio).toContain('function switchChapterSafely(nextId)');
 });
 it('lets mouse, keyboard and phone writers reach the entire formatting ribbon',()=>{
  expect(studio).toContain('className="writer-format-navigator"');
  expect(studio).toContain('aria-label="Scroll formatting tools left"');
  expect(studio).toContain('aria-label="Scroll formatting tools right"');
  expect(studio).toContain('ref={formatStripRef}');
  expect(studio).toContain('toolbarScrollAmount(strip.clientWidth,direction)');
  expect(css).toContain('grid-template-columns:44px minmax(0,1fr) 44px');
  expect(css).toContain('@media(max-width:760px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(main).toContain("import './writer-toolbar-flow.css'");
 });
});
