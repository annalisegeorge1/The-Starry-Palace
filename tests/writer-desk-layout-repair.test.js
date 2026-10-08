import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/writer-desk-layout-repair.css','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');

describe('Writing Chamber layout repair',()=>{
 it('loads a scoped stylesheet without modifying the manuscript editor',()=>{
  expect(live).toContain("import './writer-desk-layout-repair.css';");
  expect(live).toContain('createManuscriptSaveCoordinator');
  expect(live).toContain('saveCoordinatorRef.current.persist(');
  expect(live).toContain('contentEditable');
  expect(css).not.toMatch(/\b(?:position\s*:\s*fixed|display\s*:\s*none)\b/i);
 });
 it('gives chapter controls a full-width row rather than a 34px grid column',()=>{
  expect(css).toContain('.writing-chapter-manager .chapter-manager-row');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(css).toContain('.chapter-manager-row>.chapter-row-extras');
  expect(css).toContain('grid-column:1!important');
  expect(css).toContain('.chapter-folder-assignment select');
  expect(css).toContain('.chapter-order-controls');
 });
 it('puts the second save bar below the manuscript instead of floating in the utilities column',()=>{
  expect(css).toContain('@media(min-width:1280px)');
  expect(css).toContain('"canvas status"');
  expect(css).toContain('"actions actions"');
  expect(css).toContain('.chic-editor-form>.chic-studio-buttons');
  expect(css).toContain('position:static!important');
  expect(css).toContain('bottom:auto!important');
  expect(live).toContain('className="studio-buttons chic-studio-buttons"');
  expect(live).toContain('className="button-starlight" onClick={quickSaveChapter}>Save now');
 });
 it('preserves readable, scrollable formatting tools in both light and dark modes',()=>{
  expect(css).toContain('.manuscript-sticky-toolbar .writer-format-scroll button');
  expect(css).toContain('font-size:.79rem!important');
  expect(css).toContain('focus-visible');
  expect(css).toContain('body.daylight.writing-desk-open');
  expect(css).toContain('@media(max-width:1279px)');
  expect(css).toContain('@media(max-width:500px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
