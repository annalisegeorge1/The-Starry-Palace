import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shell=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/writing-chamber-lustre-pass.css','utf8');
const room=readFileSync('src/liveRooms.jsx','utf8');

describe('Writing Chamber glass and usability pass',()=>{
 it('loads after approved Nightfall and Daylight without touching their source',()=>{
  const base=shell.indexOf("import './palace-muted-midnight-core.css';");
  const writer=shell.indexOf("import './writing-chamber-lustre-pass.css';");
  expect(base).toBeGreaterThan(0);
  expect(writer).toBeGreaterThan(base);
  expect(css).toContain('var(--lustre-soft)');
  expect(css).toContain('var(--lustre-card)');
  expect(css).toContain('var(--lustre-shadow)');
 });
 it('restores real glass depth to the manuscript library',()=>{
  for(const selector of [
   '.writing-pad-launch',
   '.chic-writing-library-tools',
   '.writer-new-work-fold,.writer-inspiration-fold',
   '.chic-draft-list .writer-work-card',
   '.writer-work-card:hover',
  ])expect(css).toContain(selector);
  expect(css).toContain('background:var(--lustre-soft)!important;');
  expect(css).toContain('box-shadow:var(--lustre-small-shadow)!important;');
  expect(css).toContain('border-color:var(--lustre-border)!important;');
 });
 it('keeps long next-action titles legible instead of ellipsized at 0.6rem',()=>{
  expect(room).toContain('className="writing-focus-strip"');
  expect(css).toContain('.writing-focus-strip strong');
  expect(css).toContain('.writing-focus-strip p');
  expect(css).toContain('white-space:normal!important;');
  expect(css).toContain('overflow-wrap:anywhere;');
  expect(css).toContain('font-size:.78rem!important;');
  expect(css).toContain('min-height:44px;');
 });
 it('keeps Daylight writing actions blue/lilac and text readable',()=>{
  expect(css).toContain('.full-palace-shell.daylight .writing-pad-launch');
  expect(css).toContain('linear-gradient(124deg,#7756b8 0%,#5372bd 57%,#326c9e 100%)');
  expect(css).toContain('color:#fff!important;');
  expect(css).toContain('.full-palace-shell.daylight .writing-focus-strip :is(strong,p)');
  expect(css).toContain('color:#273958!important;');
 });
 it('gives the manuscript priority while leaving the actual editor mounted',()=>{
  expect(room).toContain('className="legacy-editor-form chic-editor-form"');
  expect(room).toContain('className="legacy-writing-canvas" contentEditable');
  expect(room).toContain('onInput={e=>{rememberFormattingSelection();editorMetricsRef.current?.schedule();queue');
  expect(css).toContain('.writing-studio-grid:not(.rail-collapsed)');
  expect(css).toContain('grid-template-columns:248px minmax(0,1fr)!important;');
  expect(css).toContain('.writer-sprint-orbit');
  expect(css).toContain('.writer-sprint-controls :is(button,select)');
  expect(css).toContain('.manuscript-sticky-toolbar .writer-format-scroll button');
  expect(css).toContain('min-height:43px!important;');
 });
 it('replaces permanent formatting guidance with a native accessible tap/keyboard help disclosure',()=>{
  expect(room).toContain('<details className="manuscript-toolbar-note writer-toolbar-help">');
  expect(room).toContain('aria-label="How formatting and personal writing views work"');
  expect(room).toContain('className="writer-toolbar-help-content"');
  expect(room).toContain('Bold, headings, lists and paragraph formatting stay in the saved chapter.');
  expect(room).not.toContain('<div className="manuscript-toolbar-note"><span');
  expect(css).toContain('.writer-toolbar-help>summary:focus-visible');
  expect(css).toContain('.writer-toolbar-help-content');
  expect(css).toContain('.full-palace-shell.daylight .writer-toolbar-help-content');
  expect(css).toContain('width:min(338px,calc(100vw - 40px));');
  expect(css).toContain('.writer-toolbar-help:not([open])>.writer-toolbar-help-content');
  expect(css).toContain('display:none!important;');
 });
 it('keeps Focus mode reversible on desktop and mobile while preventing sticky-header overlap',()=>{
  expect(room).toContain("aria-pressed={focusMode} onClick={()=>setFocusMode(v=>!v)}>{focusMode?'Exit focus · Esc':'Enter focus'}");
  expect(room).toContain('className="writer-focus-exit"');
  expect(room).toContain('aria-label="Exit focus mode and restore the writing desk"');
  expect(room).toContain('onClick={()=>setFocusMode(false)}');
  expect(room).toContain("else if(e.key==='Escape'&&focusMode){setFocusMode(false)}");
  expect(css).toContain('/* FOCUS MODE: no overlapping sticky headers');
  expect(css).toContain('.chic-editor-form>.editor-chapter-heading');
  expect(css).toContain('position:relative!important;');
  expect(css).toContain('.chic-editor-form>.manuscript-sticky-toolbar');
  expect(css).toContain('top:0!important;');
  expect(css).toContain('.writer-chapter-jump-actions>.writer-focus-exit');
  expect(css).toContain('position:sticky;');
  expect(css).toContain('left:0;');
  expect(css).toContain('.full-palace-shell.daylight .writer-focus-exit');
 });
 it('leaves manuscript data, actual page styles, autosave, publishing and art unchanged',()=>{
  for(const protectedSelector of [
   '.legacy-writing-canvas','.writing-page-stage','.chapter-manager-row',
   '.editor-canvas','.reader-page','.chamber-frame','.badge-card',
   '.member-avatar',
  ])expect(css).not.toContain(protectedSelector);
  expect(css).not.toContain('url(');
  expect(css).not.toContain('@keyframes');
  expect(css).not.toMatch(/contentEditable\\s*[:=]/);
  expect(css).not.toContain('dangerouslySetInnerHTML');
  // Only the redundant help-label text is hidden on phone-width screens.
  // Neither the formatting ribbon nor the writer's chapter is hidden here.
  expect(css).toContain('.writer-toolbar-help>summary>span:last-child');
  expect(css).not.toMatch(/\\.writer-format-scroll[^{}]*\\{[^}]*display\\s*:\\s*none/);
  expect(css).not.toMatch(/\\.legacy-writing-canvas[^{}]*\\{[^}]*display\\s*:\\s*none/);
  // Reject geometry transforms without mistaking the Folder label's text-transform for one.
  expect(css).not.toMatch(/(^|[;{}\\s])transform\\s*:/m);
 });
 it('keeps mobile chapter metrics and all real actions out of the narrow second column',()=>{
  expect(room).toContain('className="legacy-editor-stats chic-editor-stats"');
  expect(room).toContain('className="editor-stat-actions"');
  expect(room).toContain('duplicateCurrentChapter');
  expect(room).toContain('openSnapshots');
  expect(css).toContain('/* LONG-SESSION MOBILE DESK');
  expect(css).toContain('.chic-editor-form>.chic-editor-stats');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important;');
  expect(css).toContain('.chic-editor-stats .editor-stat-actions');
  expect(css).toContain('grid-column:1/-1!important;');
  expect(css).toContain('flex-wrap:wrap!important;');
  expect(css).toContain('white-space:normal!important;');
  expect(css).toContain('min-height:43px!important;');
 });
 it('makes mobile chapter selectors and goals readable without shrinking the manuscript',()=>{
  expect(css).toContain('@media(max-width:600px)');
  expect(css).toContain('.writing-chapter-manager-tools input,');
  expect(css).toContain('.writer-chapter-jump-main select,');
  expect(css).toContain('.editor-goal-control input');
  expect(css).toContain('font-size:16px!important;');
  expect(css).toContain('grid-template-columns:43px minmax(0,1fr) 43px!important;');
  expect(css).toContain('min-height:44px!important;');
  expect(css).not.toContain('word-break:break-all');
 });
 it('lets desktop writers hide and restore chapter navigation without touching the manuscript',()=>{
  expect(room).toContain('id="writer-chapter-rail" className="writing-studio-rail"');
  expect(room).toContain('className="writer-rail-quick-toggle"');
  expect(room).toContain("aria-controls={!railCollapsed?'writer-chapter-rail':undefined}");
  expect(room).toContain('aria-expanded={!railCollapsed}');
  expect(room).toContain("aria-label={railCollapsed?'Show chapter sidebar':'Hide chapter sidebar'}");
  expect(room).toContain("onClick={()=>setRailCollapsed(v=>!v)}");
  expect(room).toContain("localStorage.setItem('palace-writer-rail',railCollapsed?'collapsed':'open')");
  expect(css).toContain('/* MANUSCRIPT-FIRST DESKTOP');
  expect(css).toContain('.writer-toolbar-utilities');
  expect(css).toContain('@media(min-width:1121px)');
  expect(css).toContain('body.writing-desk-open:not(.focus-editor)');
  expect(css).toContain('display:inline-flex!important;');
 });
 it('normalizes the Folder label and tightens only surrounding editor chrome',()=>{
  expect(room).toContain('className="chapter-folder-assignment"><span>Folder</span>');
  expect(css).toContain('.chapter-row-extras .chapter-folder-assignment>span');
  expect(css).toContain('font:700 .72rem/1.35 system-ui');
  expect(css).toContain('.manuscript-sticky-toolbar .writer-chapter-jump');
  expect(css).toContain('.manuscript-sticky-toolbar .manuscript-type-ribbon');
  expect(css).toContain('.manuscript-sticky-toolbar .writer-format-scroll');
  expect(css).toContain('@media(min-width:761px)');
  expect(css).toContain('.full-palace-shell.daylight .writer-rail-quick-toggle');
 });
 it('has visible keyboard focus and small-screen touch-safe controls',()=>{
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(max-width:650px)');
  expect(css).toContain('white-space:normal;');
  expect(css).toContain('max-width:100%;');
 });
});
