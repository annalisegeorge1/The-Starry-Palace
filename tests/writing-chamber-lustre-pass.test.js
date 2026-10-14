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
  expect(css).not.toContain('display:none');
  expect(css).not.toContain('transform:');
 });
 it('has visible keyboard focus and small-screen touch-safe controls',()=>{
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(max-width:650px)');
  expect(css).toContain('white-space:normal;');
  expect(css).toContain('max-width:100%;');
 });
});
