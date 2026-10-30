import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {READER_LAYOUTS,READER_LAYOUT_VALUES,readerLayoutLabel} from './readerLayoutModel.js';
const source=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const rooms=source('src/liveRooms.jsx');
const classic=source('src/ArchiveClassicReader.jsx');
const css=source('src/reader-layout-choices.css');
const main=source('src/main.jsx');
describe('reader-selectable page layouts',()=>{
 it('offers four distinct, valid and labelled modes',()=>{
  expect(READER_LAYOUT_VALUES).toEqual(['book','full','journal','compact']);
  expect(new Set(READER_LAYOUT_VALUES).size).toBe(4);
  expect(READER_LAYOUTS.every(x=>x.label&&x.description&&x.short)).toBe(true);
  expect(readerLayoutLabel('journal')).toBe('Journal');
  expect(readerLayoutLabel('invalid')).toBe('Full Page');
 });
 it('persists local reader choice, keeps existing text controls and resets',()=>{
  expect(rooms).toContain("readPalaceChoice('palace-reader-layout',READER_LAYOUT_VALUES,'full')");
  expect(rooms).toContain("setReaderLayout('full')");
  expect(classic).toContain("readPalaceChoice(LAYOUT_KEY,READER_LAYOUT_VALUES,'full')");
  expect(classic).toContain("setLayout('full')");
  expect(rooms).toContain("writePalacePreference('palace-reader-layout',next)");
  expect(rooms).toContain("removePalacePreference(key)");
  expect(rooms).toContain("changeMeasure('wide')");
  expect(rooms).toContain('reader-layout-option-grid');
  expect(rooms).toContain('aria-pressed={readerLayout===item.value}');
  expect(rooms).toContain('" layout-"+readerLayout');
  expect(rooms).toContain('dangerouslySetInnerHTML={{__html:html}}');
  expect(rooms).toContain('getWorkReaderState(session.user.id,d.work.id)');
 });
 it('uses the same layouts in hosted classics without changing navigation',()=>{
  expect(classic).toContain("const LAYOUT_KEY='palace-reader-layout'");
  expect(classic).toContain("changeSetting('layout',e.target.value)");
  expect(classic).toContain("' layout-'+layout");
  expect(classic).toContain('changePage(target)');
 });
 it('scopes responsive layouts to their own reader and retains tone',()=>{
  for(const v of READER_LAYOUT_VALUES)expect(css).toContain('.layout-'+v);
  expect(css).toContain('.reader-page.tone-paper');
  expect(css).toContain('@media(max-width:660px)');
  expect(main).toContain("import './reader-layout-choices.css';");
 });
});
