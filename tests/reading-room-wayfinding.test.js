import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const reading=live.split('export function ReadingLive(')[1]?.split('export function WritingLive(')[0]||'';
const css=readFileSync(resolve(process.cwd(),'src/reading-room-wayfinding.css'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('Reading Room wayfinding and empty-shelf rescue',()=>{
 it('never sneaks a reader into an unrelated story when filters are empty',()=>{
  expect(reading).toContain('const choice=chooseReadingSurprise(catalogue)');
  expect(reading).not.toContain('filtered.length?filtered:roomWorks');
  expect(reading).toContain('disabled={!catalogue.length} onClick={surpriseMe}');
 });
 it('gives active filters their own removable, accessible controls',()=>{
  expect(reading).toContain('const activeReadingFilters=readingFilterChips(');
  expect(reading).toContain('aria-label="Active Reading Room filters"');
  expect(reading).toContain('aria-label={\'Remove \'+item.label+\' filter\'}');
  expect(reading).toContain('Clear all filters →');
  expect(reading).toContain('setOrigin(\'all\')');
  expect(reading).toContain('setReaderLens(\'all\')');
 });
 it('tells the difference between zero matches and a truly empty Palace shelf',()=>{
  expect(reading).toContain('catalogue.length===0&&<div className="reading-catalogue-empty"');
  expect(reading).toContain('No worlds match these choices yet.');
  expect(reading).toContain('This shelf is waiting for its first story.');
  expect(reading).toContain('Show every story →');
  expect(reading).toContain('Try advanced search →');
 });
 it('gives zero-result advanced searches a useful reset',()=>{
  expect(reading).toContain('setAdvancedSearched(true)');
  expect(reading).toContain('advancedSearched&&advancedResults.length===0');
  expect(reading).toContain('No worlds match that constellation yet.');
  expect(reading).toContain('Start a new search →');
 });
 it('keeps a touch-friendly reading visual layer in both themes',()=>{
  expect(main.indexOf("import './reading-room-wayfinding.css';")).toBeGreaterThan(main.indexOf("import './palace-creative-flow.css';"));
  expect(css).toContain('.reading-filter-trail');
  expect(css).toContain('.reading-catalogue-empty');
  expect(css).toContain('.reading-advanced-empty');
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('@media(max-width:650px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
