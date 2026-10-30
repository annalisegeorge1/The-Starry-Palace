import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const css=readFileSync(resolve(process.cwd(),'src/palace-mobile-overlap-repair.css'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
describe('Android layout repair guardrails',()=>{
 it('loads the narrow-screen fixes after legacy styles',()=>{
  const imports=[...main.matchAll(/import '\.\/[^']+\.css';/g)].map(m=>m[0]);
  expect(imports.at(-1)).toContain('palace-mobile-overlap-repair.css');
 });
 it('returns chapter toolbar and publish actions to document flow on phones',()=>{
  expect(css).toMatch(/body\.writing-desk-open \.chic-editor-form>\.manuscript-sticky-toolbar\s*\{\s*position:sticky!important/);
  expect(css).toContain('body.writing-desk-open .chic-editor-form>.chic-studio-buttons{');
  expect(css).toContain('position:static!important');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('data-mobile-tools-open="false"');
  expect(css).toContain('.writer-mobile-tools-strip');
  expect(css).toContain('body.writing-desk-open .chic-editor-form>.manuscript-sheet-frame .legacy-writing-canvas');
  expect(live).toContain('aria-controls="writer-mobile-formatting-panel"');
  expect(live).toContain('data-mobile-tools-open={mobileToolsOpen?"true":"false"}');
  expect(live).toContain('data-mobile-chapter-open={mobileChapterToolsOpen?"true":"false"}');
  expect(live).toContain('className="writer-mobile-chapter-toggle"');
  expect(live).toContain('ref={mobileAppearanceRef}');
  expect(live).toContain('ref={mobileMoreRef}');
  expect(css).toContain('max-height:min(54dvh,370px)!important');
  expect(css).toContain('flex-wrap:nowrap!important');
  expect(css).toContain('[data-mobile-chapter-open="true"]>.writer-chapter-jump');
  expect(live).toContain('onClick={openPrivateChapterPreview}');
  expect(live).toContain('onClick={quickSaveChapter}');
  expect(live).toContain('onClick={publish}');
 });
 it('keeps the almanac empty message and calendar link on readable rows',()=>{
  expect(css).toContain('.palace-almanac-card .following-chamber-empty.compact');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(css).toContain('word-break:normal!important');
  expect(live).toContain('No Palace event or exact-date observance');
 });
 it('leaves mobile theme available in the sidebar while hiding duplicated floaters',()=>{
  expect(css).toContain('.palace-shell.full-palace-shell .restored-floating-controls{');
  expect(css).toContain('display:none!important');
  expect(main).toContain('className="sidebar-theme"');
 });
});
