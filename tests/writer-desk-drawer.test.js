import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const rooms=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const studio=rooms.split('export function WorkStudioLive(')[1]?.split('export function ')[0]||'';
const styles=readFileSync(resolve(process.cwd(),'src/writer-desk-drawer.css'),'utf8');
const imports=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('calmer manuscript workspace',()=>{
 it('keeps optional tools together and gives the chapter page its own uninterrupted path',()=>{
  const opening=studio.indexOf('<details ref={deskToolsRef} className="writer-desk-drawer"');
  const body=studio.indexOf('<div className="writer-desk-drawer-body">',opening);
  const view=studio.indexOf('className="writer-view-controls"',opening);
  const map=studio.indexOf('className="writer-document-map"',opening);
  const notes=studio.indexOf('className="writer-margin-notes"',opening);
  const find=studio.indexOf('className="legacy-find-replace writer-find-replace"',opening);
  const spell=studio.indexOf('className="legacy-spellcheck"',opening);
  const close=studio.indexOf('    </details>\n   <div className="legacy-goal-progress">',opening);
  const manuscript=studio.indexOf('className="legacy-writing-canvas"',close);
  expect(opening).toBeGreaterThan(0);
  expect(body).toBeGreaterThan(opening);
  expect(view).toBeGreaterThan(body);
  expect(map).toBeGreaterThan(view);
  expect(notes).toBeGreaterThan(map);
  expect(find).toBeGreaterThan(notes);
  expect(spell).toBeGreaterThan(find);
  expect(close).toBeGreaterThan(spell);
  expect(manuscript).toBeGreaterThan(close);
 });
 it('remembers the drawer preference without requiring access to browser storage',()=>{
  expect(studio).toContain("defaultOpen={readPalacePreference('palace-writing-tools-expanded','false')==='true'}");
  expect(studio).toContain("onToggle={e=>writePalacePreference('palace-writing-tools-expanded',e.currentTarget.open?'true':'false')}");
  expect(studio).toContain('<summary><span aria-hidden="true" className="writer-desk-drawer-glyph">');
  expect(studio).toContain('Page appearance · Chapter map · Notes · Find');
 });
 it('allows Ctrl/⌘ F and the toolbar to open Find inside the collapsed drawer',()=>{
  const handler=studio.split('function openFindPanel()')[1]?.split('function editorViewClass()')[0]||'';
  expect(handler).toContain('deskToolsRef.current.open=true');
  expect(handler).toContain('findPanelRef.current.open=true');
  expect(handler).toContain('window.requestAnimationFrame(()=>findInputRef.current?.focus())');
  expect(studio).toContain("else if(mod&&inEditor&&key==='f'){e.preventDefault();openFindPanel()}");
  expect(studio).toContain('onClick={openFindPanel} aria-label="Find and replace in this chapter"');
 });
 it('does not hide save warnings, the chapter goal, or editing surface',()=>{
  const a=studio.indexOf('className="writer-recovery-alert"'),b=studio.indexOf('className="writer-desk-drawer"');
  expect(a).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(a);
  expect(studio).toContain('writer-toolbar-save-state state-');
  expect(studio).toContain('className="legacy-goal-progress"');
  expect(studio).toContain('contentEditable suppressContentEditableWarning');
  expect(studio).toContain('createManuscriptSaveCoordinator(');
  expect(studio).toContain('recoverySchedulerRef.current?.flush()');
 });
 it('retains accessible native details in light and dark mode on phones',()=>{
  expect(styles).toContain('.writer-desk-drawer > summary:focus-visible');
  expect(styles).toContain('.writer-desk-drawer[open]');
  expect(styles).toContain('.daylight');
  expect(styles).toContain('@media(max-width:760px)');
  expect(styles).toContain('min-height:44px');
  expect(styles).toContain('prefers-reduced-motion:reduce');
  expect(imports).toContain("import './writer-desk-drawer.css';");
 });
});
