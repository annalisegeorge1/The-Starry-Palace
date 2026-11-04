import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/tablet-daybreak-reading-polish.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Daybreak tablet and desktop reading polish',()=>{
 it('loads after other theme and reader styling',()=>{
  const finalImport="import './tablet-daybreak-reading-polish.css';";
  expect(main).toContain(finalImport);
  expect(main.indexOf(finalImport)).toBeGreaterThan(main.indexOf("import './reader-endflow-accessibility.css';"));
 });
 it('keeps the sticky Daybreak header opaque and above scroll content',()=>{
  expect(css).toContain('.daylight .full-stage > header.topbar.full-topbar');
  expect(css).toContain('background: #faf9ff !important');
  expect(css).toContain('background-image: none !important');
  expect(css).toContain('backdrop-filter: none !important');
  expect(css).toContain('z-index: 800 !important');
  expect(css).toContain('scroll-margin-top: 96px !important');
 });
 it('flattens the Reading search row and keeps the count beside it',()=>{
  expect(css).toContain('.chic-reading-tools.reading-search-calm');
  expect(css).toContain('display: flex !important');
  expect(css).toContain('background: transparent !important');
  expect(css).toContain('flex: 0 1 auto !important');
  expect(css).toContain('text-align: right !important');
  expect(css).toContain('.reading-multi-tag-summary');
 });
 it('reduces select height but preserves tag search inputs and mobile layout',()=>{
  expect(css).toContain('.reading-facet-sidebar select');
  expect(css).toContain('height: 34px !important');
  expect(css).toContain('@media (min-width: 761px)');
  expect(css).not.toContain('.reading-facet-sidebar input[type=search] {');
 });
 it('keeps the mobile dock off desktop and softens Daybreak subnav selection',()=>{
  expect(css).toContain('.mobile-palace-dock');
  expect(css).toContain('display: none !important');
  expect(css).toContain('#palace-sidebar .full-subnav > a.active');
  expect(css).toContain('background: #e7dff3 !important');
 });
});
