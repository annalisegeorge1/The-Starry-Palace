import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/reading-mobile-story-cards.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');
const reader=readFileSync('src/liveRooms.jsx','utf8');
const summary=readFileSync('src/ReadingStoryContext.jsx','utf8');
const tags=readFileSync('src/ReadingCardTags.jsx','utf8');
const stats=readFileSync('src/ReadingStoryStats.jsx','utf8');

describe('Readable mobile Reading Room story cards',()=>{
 it('loads the compact mobile layout after the existing mobile style overrides',()=>{
  expect(shell).toContain("import './reading-mobile-story-cards.css';");
  expect(shell.indexOf("import './reading-mobile-story-cards.css';"))
   .toBeGreaterThan(shell.indexOf("import './palace-mobile-theme-parity.css';"));
  expect(css).toContain('@media (max-width:720px)');
  expect(css).toContain('(max-height:600px) and (pointer:coarse)');
 });
 it('removes the narrow-column trap on both rotating and standard shelves',()=>{
  expect(css).toContain('.legacy-constellation-list article>div:last-child');
  expect(css).toContain('.story-row>div:last-child');
  expect(css).toContain('display:contents!important;');
  expect(css).toContain('display:flow-root!important;');
  expect(css).toContain('float:left!important;');
  expect(css).toContain('clear:both!important;');
  expect(css).toContain('.reading-story-context.is-compact');
  expect(css).toContain('max-width:none!important;');
 });
 it('still shows full details and reading buttons without concealing metadata',()=>{
  expect(reader).toContain('<ReadingStoryContext work={w} compact/>');
  expect(reader).toContain('<ReadingStoryStats work={w}/>');
  expect(reader).toContain('<ReadingCardTags tags={workTags(w)} limit={3}/>');
  expect(reader).toContain('storyCta(w)');
  expect(summary).toContain('Read full summary ↓');
  expect(summary).toContain('<details className="reading-story-context-extra">');
  expect(tags).toContain('aria-expanded={expanded}');
  expect(stats).toContain('Words:');
  expect(stats).toContain('Chapters:');
  expect(stats).toContain('Comments:');
  expect(stats).toContain('Bookmarks:');
  expect(css).toContain('min-height:44px!important');
 });
 it('does not replace the existing rainbow and light/dark colour treatments',()=>{
  expect(css).not.toContain('background:linear-gradient');
  expect(css).not.toContain('.prism-story{');
  expect(css).not.toContain('.daylight{');
  expect(css).not.toContain('.nightfall{');
 });
});
