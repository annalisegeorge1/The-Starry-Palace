import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=(path)=>readFileSync(resolve(process.cwd(),path),'utf8');
const rooms=read('src/liveRooms.jsx');
const data=read('src/palaceData.js');
const styles=read('src/reader-journey-path.css');
const main=read('src/main.jsx');
const chapter=rooms.slice(rooms.indexOf('function ReaderChapter({Frame,slug,chapterId})'),rooms.indexOf('function palaceLocalDateTimeValue(',rooms.indexOf('function ReaderChapter({Frame,slug,chapterId})')));
const story=rooms.slice(rooms.indexOf('export function WorkLive({Frame})'),rooms.indexOf('export function ChapterLive(',rooms.indexOf('export function WorkLive({Frame})')));

describe('Reader continuity from story to chapter, writer and private Library',()=>{
 it('reuses the existing loaded reader state, rather than inventing saved status',()=>{
  expect(chapter).toContain('getWorkReaderState(session.user.id,d.work.id)');
  expect(chapter).toContain('const[readerSaved,setReaderSaved]=useState(null)');
  expect(chapter).toContain('setReaderSaved(!!readerState.saved)');
  expect(chapter).toContain("setReaderSaved(null);setReaderSaveMessage('');");
  expect(chapter).toContain("setReaderSaved(null);setReaderSaveMessage('Library status is unavailable");
  expect(chapter).not.toContain('localStorage.setItem(\'palace-saved-story');
  expect(data).toContain("from('saved_works').upsert");
 });
 it('can save and unsave the current work while keeping the chapter open',()=>{
  expect(chapter).toContain('async function toggleChapterSave(){');
  expect(chapter).toContain('if(!session?.user?.id||!data?.work?.id||readerSaveBusy||readerSaved===null)return;');
  expect(chapter).toContain('await setWorkSaved(session.user.id,data.work.id,next)');
  expect(chapter).toContain('setReaderSaved(next)');
  expect(chapter).toContain("Story saved to My Library.");
  expect(chapter).toContain("Story removed from My Library.");
  expect(chapter).toContain('aria-pressed={readerSaved===true}');
  expect(chapter).toContain('disabled={readerSaveBusy||readerSaved===null}');
  expect(chapter).toContain('className="reader-story-passage-status" role="status"');
 });
 it('gives chapter readers the writer, Reading Rooms, and My Library doors',()=>{
  expect(chapter).toContain('className="reader-story-passage"');
  expect(chapter).toContain('aria-label="Continue your Palace reading journey"');
  expect(chapter).toContain('<Link to="/reading">');
  expect(chapter).toContain('encodeURIComponent(data.work.profiles.username)');
  expect(chapter).toContain('<Link to="/library?tab=continue">');
  expect(chapter).toContain('Sign in to save</Link>');
  expect(chapter).toContain("encodeURIComponent('/work/'+data.work.slug+'/chapter/'+data.chapter.id)");
  expect(chapter).toContain('id="palace-reader-chapters"');
  expect(chapter).toContain('Back to chapter start');
 });
 it('turns guest Save/Follow controls on the story overview into a working sign-in link',()=>{
  expect(story).toContain('{session?<><button className={readerState.saved?');
  expect(story).toContain('className="quiet-button work-guest-keep"');
  expect(story).toContain("encodeURIComponent('/work/'+data.slug)");
  expect(story).toContain('Sign in to save or follow');
  expect(story).toContain('onClick={()=>keep(\'save\')}');
  expect(story).toContain('onClick={()=>keep(\'follow\')}');
 });
 it('keeps chapter controls quiet, nonsticky, responsive, and readable in both themes',()=>{
  expect(styles).toContain('.reader-page .reader-story-passage');
  expect(styles).toContain('flex-wrap:wrap;');
  expect(styles).toContain('min-height:42px;');
  expect(styles).toContain('@media(max-width:680px)');
  expect(styles).toContain('@media(max-width:390px)');
  expect(styles).toContain('.palace-shell.daylight');
  expect(styles).toContain('.reader-page.tone-paper');
  expect(styles).toContain('.reader-page.tone-soft');
  expect(styles).toContain(':focus-visible');
  expect(styles).toContain('prefers-reduced-motion:reduce');
  expect(styles).not.toContain('position:sticky');
  expect(styles).not.toContain('aspect-ratio');
  expect(main).toContain("import './reader-journey-path.css';");
  expect(main.indexOf("import './reader-journey-path.css';")).toBeGreaterThan(main.indexOf("import './chamber-creative-shelf-polish.css';"));
 });
});
