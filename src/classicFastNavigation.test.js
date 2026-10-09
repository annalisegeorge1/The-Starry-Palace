import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const source=read('src/ArchiveClassicReader.jsx');
const css=read('src/classic-fast-navigation.css');
describe('Classic archive reader fast navigation wiring',()=>{
 it('limits the chapter dropdown and lets readers search every section',()=>{
  expect(source).toContain('classicChapterChoices(contents,chapterQuery,activeSourceIndex)');
  expect(source).toContain('contents.length>36');
  expect(source).toContain('Find a chapter or section in this edition');
  expect(source).toContain('chapterChoices.items.map(');
  expect(source).not.toContain('contents.map(item=><option');
 });
 it('replaces the giant page selector with an accessible numeric Go control',()=>{
  expect(source).toContain('total>CLASSIC_NUMERIC_PAGE_THRESHOLD');
  expect(source).toContain('type="number"');
  expect(source).toContain('inputMode="numeric"');
  expect(source).toContain('classicNumericPage(pageEntry,total)');
  expect(source).toContain('onSubmit={submitDirectPage}');
  expect(source).toContain('Reading page number');
 });
 it('keeps reader preferences, saved reading position and a real chapter selector',()=>{
  for(const text of ['writePalacePreference(pageKey,current)','jumpToHeading(item)','archive-classic-reader-toolbar','onChange={e=>changePage(e.target.value)}'])expect(source).toContain(text);
 });
 it('supports prose/section hierarchy and accessible small screens',()=>{
  expect(source).toContain('archive-classic-book-heading');
  expect(source).toContain('archive-classic-chapter-heading');
  expect(css).toContain('@media(max-width:620px)');
  expect(css).toContain('.archive-classic-chapter-controls');
  expect(css).toContain('.archive-classic-page-direct');
 });
});
