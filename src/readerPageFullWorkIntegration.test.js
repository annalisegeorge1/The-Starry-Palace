import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readerFlow,readerPageNumber,readerPagePercent} from './readerFlowModel.js';
const file=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const rooms=file('src/liveRooms.jsx');
const data=file('src/palaceData.js');
const main=file('src/main.jsx');
const full=file('src/FullWorkReader.jsx');
const paged=file('src/PalacePagedReader.jsx');
const styles=file('src/reader-page-turn.css');
describe('page turns and whole-work reading safety',()=>{
 it('keeps full-work navigation calm without removing any reader settings',()=>{
  expect(full).toContain('palace-full-chapter-jump');
  expect(full).toContain('Jump to a chapter in this work');
  expect(full).toContain('aria-controls="palace-full-work-settings"');
  expect(full).toContain("flow==='scroll'?'pages':'scroll'");
  expect(full).not.toContain('className="reader-flow-select"');
  expect(full).not.toContain("Read the published chapters together without changing");
  expect(full).toContain("writePalacePreference('palace-reader-layout',value)");
  expect(full).toContain("writePalacePreference('palace-reader-flow',next)");
  expect(full).toContain("safeReaderHtml(ch.body_html");
  expect(styles).toContain('.palace-full-chapter-jump :is(summary,select):focus-visible');
 });
 it('keeps chapter scrolling default and stores reader-selected page turns',()=>{
  expect(rooms).toContain("readPalaceChoice('palace-reader-flow',READER_FLOWS,'scroll')");
  expect(rooms).toContain("writePalacePreference('palace-reader-flow',flow)");
  expect(rooms).toContain("setReaderFlowMode('scroll')");
  expect(rooms).toContain('onPositionChange={onPagedPositionChange}');
  expect(readerFlow(undefined)).toBe('scroll');
  expect(readerPageNumber(95,9)).toBe(9);
  expect(readerPagePercent(1,9)).toBe(0);
 });
 it('does not fetch author drafts for full-work rendering',()=>{
  const helper=data.slice(data.indexOf('export async function getPublishedWorkForReading('),data.indexOf('export async function getChapter('));
  expect(helper).toContain("work.publication_status!=='published'");
  expect(helper).toContain("work.visibility==='private'");
  expect(helper).toContain("filter(ch=>ch.status==='published')");
  expect(helper).toContain(".eq('status','published')");
  expect(helper).not.toContain('getWorkExport(');
  expect(full).toContain('getPublishedWorkForReading(slug)');
  expect(full).toContain('safeReaderHtml(ch.body_html');
  expect(full).toContain('escapeHeading(ch.title)');
  expect(full).not.toContain('completePalaceReading(');
  expect(full).not.toContain('recordReadingProgress(');
 });
 it('keeps individual notes, chapter praise and progress unchanged',()=>{
  expect(rooms).toContain('getReaderNotesForChapter(');
  expect(rooms).toContain("givePalacePraise('chapter'");
  expect(rooms).toContain('recordReadingProgress(');
  expect(rooms).toContain('onClick={()=>finish(true)}');
  expect(rooms).toContain('readerFlowMode===\'pages\'');
  expect(rooms).toContain('readerFlowMode===\'scroll\'');
 });
 it('supports keyboard page turns and narrow mobile screens',()=>{
  expect(paged).toContain("e.key==='ArrowRight'");
  expect(paged).toContain("e.key==='ArrowLeft'");
  expect(paged).toContain('onTouchStart={touchStart}');
  expect(paged).toContain('onTouchEnd={touchEnd}');
  expect(paged).toContain('viewport.clientWidth>=920?2:1');
  expect(paged).toContain('geometry.spread===2');
  expect(styles).toContain('column-width:var(--palace-page-width');
  expect(styles).toContain('@media(max-width:600px)');
  expect(main).toContain('path="/work/:slug/full"');
  expect(main).toContain("import './reader-page-turn.css';");
  expect(rooms).toContain('☷ Read full work');
 });
});
