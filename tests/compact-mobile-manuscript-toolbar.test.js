import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const manuscript=read('src/manuscript-pad-refinement.css');
const layout=read('src/palace-next.css');
const rooms=read('src/liveRooms.jsx');
const toolbar=read('src/writer-toolbar-flow.css');
const drawer=read('src/writer-desk-drawer.css');

describe('mobile manuscript-first toolbar',()=>{
 const phone=manuscript.split('/* On phones the manuscript, not the duplicate font settings')[1]?.split('@media(min-width:761px)')[0]||'';

 it('keeps a compact, sticky chapter/format bar without covering the manuscript with duplicated typography',()=>{
  expect(phone).toContain('@media(max-width:760px)');
  expect(phone).toContain('.manuscript-sticky-toolbar .manuscript-type-ribbon');
  expect(phone).toContain('display:none!important');
  expect(phone).toContain('top:56px!important');
  expect(phone).toContain('max-width:100%!important');
  expect(phone).toContain('.writer-format-navigator');
  expect(toolbar).toContain('writer-format-arrow');
  expect(toolbar).toContain('writer-format-scroll');
  expect(toolbar).toContain('@media(max-width:400px)');
 });
 it('retains real font, text size, line spacing, desk mood, focus, and find controls in the drawer',()=>{
  const first=rooms.indexOf('className="writer-desk-drawer"');
  const next=rooms.indexOf('className="legacy-goal-progress"',first);
  const tools=rooms.slice(first,next);
  expect(tools).toContain('Typeface · Text size · Page feel · Map · Notes · Find');
  for(const control of ['value={writerFont}','value={writerFontSize}','value={lineSpacing}','value={deskMood}','setFocusMode','className="legacy-find-replace writer-find-replace"']){
   // Text size uses a pixel display and +/- buttons instead of a select.
   if(control==='value={writerFontSize}')continue;
   expect(tools).toContain(control);
  }
  expect(tools).toContain('{writerFontSize}px');
  expect(tools).toContain('aria-pressed={focusMode}');
  expect(drawer).toContain('summary:focus-visible');
 });
 it('does not hide the save state, save-now button, chapter change or full formatting',()=>{
  const bar=rooms.slice(rooms.indexOf('className="writer-chapter-jump"'),rooms.indexOf('className="writer-desk-drawer"'));
  for(const control of ['aria-label="Switch chapter"','switchChapterSafely(','writer-toolbar-save-state','Save now','↓ Backup .txt','className="writer-format-scroll"','openFindPanel','openSnapshots']){
   expect(bar).toContain(control);
  }
  expect(phone).toContain('overflow-x:auto!important');
  expect(phone).toContain('flex-wrap:nowrap!important');
  expect(phone).toContain('max-width:min(68vw,260px)!important');
 });
 it('leaves the current desktop rail intact while deleting obsolete direct-child grid targets',()=>{
  const desktop=layout.split('/* Large desktop: centre = manuscript, right = writer utilities. */')[1]?.split('/* Mid-size/tablet:')[0]||'';
  expect(desktop).toContain('.chic-editor-form>.writer-desk-drawer{grid-area:view!important;min-width:0}');
  expect(desktop).toContain('"canvas view"');
  expect(desktop).toContain('"canvas goal"');
  for(const dead of ['.chic-editor-form>.writer-view-controls','.chic-editor-form>.writer-document-map','.chic-editor-form>.writer-margin-notes','.chic-editor-form>.writer-find-replace','.chic-editor-form>.legacy-spellcheck']){
   expect(desktop).not.toContain(dead);
  }
  expect(desktop).toContain('grid-area:canvas');
  expect(desktop).toContain('grid-area:stats');
  expect(desktop).toContain('grid-area:status');
 });
 it('keeps safe manual reload and chapter recovery independent of the toolbar changes',()=>{
  expect(rooms).toContain('createManuscriptSaveCoordinator(');
  expect(rooms).toContain('recoverySchedulerRef.current?.flush()');
  expect(rooms).toContain('downloadDraftBackup');
  expect(phone).toContain('scrollbar-color:rgba(195,166,238,.44) transparent');
  expect(manuscript).toContain('.daylight .manuscript-sticky-toolbar');
  expect(manuscript).toContain('@media(prefers-reduced-motion:reduce)');
 });
});
