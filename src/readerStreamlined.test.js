import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const source=p=>readFileSync(resolve(process.cwd(),p),'utf8');
const s=source('src/liveRooms.jsx');
const content=s.slice(s.indexOf('function ReaderChapter({Frame,slug,chapterId})'),s.indexOf('function palaceLocalDateTimeValue(',s.indexOf('function ReaderChapter({Frame,slug,chapterId})')));
describe('clean chapter reading header',()=>{
 it('avoids redundant top navigation and chapter counts',()=>{
  expect(content).not.toContain('className="reader-story-passage"');
  expect(content).not.toContain('className="reader-chapter-steps"');
  expect(content).not.toContain('Jump directly to chapter text');
  expect(content).not.toContain('CHAPTER {data.chapter.position} OF');
  expect(content).toContain('className="reader-title-line"');
  expect(content).toContain('readable.length>1&&<details className="reader-chapter-chooser"');
 });
 it('preserves all substantive reading and completion controls',()=>{
  expect(content).toContain('onClick={toggleChapterSave}');
  expect(content).toContain('setWorkSaved(session.user.id,data.work.id,next)');
  expect(content).toContain('getReaderNotesForChapter(');
  expect(content).toContain('readerFlowMode===\'pages\'');
  expect(content).toContain('Mark work finished ✦');
  expect(content).toContain('Leave a comment →');
  expect(content).toContain('Zen mode');
 });
 it('constrains standard reading lines and retains full-page layout',()=>{
  const css=source('src/reader-streamlined.css');
  expect(css).toContain('max-width:min(700px,100%)!important');
  expect(css).toContain('leading-comfortable');
  expect(css).toContain('.tone-palace .chapter-text.restored');
  expect(content).toContain("readPalaceChoice('palace-reader-layout',READER_LAYOUT_VALUES,'full')");
  expect(source('src/main.jsx')).toContain("import './reader-streamlined.css';");
 });
});
