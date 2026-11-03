import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const live=readFileSync('src/liveRooms.jsx','utf8');
const main=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/reader-endflow-accessibility.css','utf8');

describe('Reader end-of-chapter accessibility pass',()=>{
 it('loads the final reader styling after the three Palace theme layers',()=>{
  expect(main).toContain("import './palace-midnight-theme.css';");
  expect(main).toContain("import './reader-endflow-accessibility.css';");
  expect(main.indexOf("import './reader-endflow-accessibility.css';"))
   .toBeGreaterThan(main.indexOf("import './palace-midnight-theme.css';"));
 });
 it('keeps chapter praise actions accessible and responsive without replacing reward logic',()=>{
  expect(live).toContain('LEAVE A LITTLE LIGHT ON THIS CHAPTER');
  expect(live).toContain('onClick={()=>praiseChapter(k)}');
  expect(live).toContain('onClick={shareChapter}');
  expect(css).toContain('flex-wrap:nowrap!important');
  expect(css).toContain('overflow-x:auto');
  expect(css).toContain('min-height:44px!important');
  expect(css).toContain('.chapter-praise-actions button:disabled');
 });
 it('uses visible dark card text while preserving the working horizontal Story Trail',()=>{
  expect(live).toContain('className="story-trail-work"');
  expect(live).toContain('className="story-trail-door discuss"');
  expect(css).toContain('.story-trail-door :is(strong,span)');
  expect(css).toContain('color:#fff!important');
  expect(css).toContain('.story-trail-door small');
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
  expect(css).toContain('.palace-shell.full-palace-shell.midnight');
 });
 it('places a back-to-start text link before the chapter list and stacks final actions on mobile',()=>{
  expect(live).toContain('className="reader-return-top reader-return-top-before-shelf"');
  expect(live).toContain('reader-final-actions');
  expect(live.indexOf('reader-return-top-before-shelf'))
   .toBeLessThan(live.indexOf('<ReaderChapterShelf chapters={readable}'));
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
 });
 it('keeps moderated responses and gives empty states and inputs readable text',()=>{
  expect(live).toContain('Be the first to leave a response.');
  expect(live).toContain('Send for moderation');
  expect(live).toContain("work.comment_policy!=='closed'");
  expect(css).toContain('.comment-compose textarea::placeholder');
  expect(css).toContain('.comment-compose > button');
  expect(css).toContain('.reader-responses-empty');
  expect(css).toContain('.work-community{');
 });
 it('protects small-screen navigation without flattening Midnight or paper-tone reading',()=>{
  expect(css).toContain('scroll-margin-bottom:calc(120px + env(safe-area-inset-bottom,0px))');
  expect(css).toContain('header.topbar.full-topbar');
  expect(css).toContain(':not(.daylight):not(.midnight)');
  expect(css).not.toContain('.chapter-text.restored{background:');
 });
});
