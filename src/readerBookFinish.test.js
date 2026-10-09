import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=p=>readFileSync(resolve(process.cwd(),p),'utf8');
const css=read('src/reader-book-finish.css'),live=read('src/liveRooms.jsx');
describe('Reader typography and story overview finishing pass',()=>{
 it('keeps book typography as presentation, not a change to saved reader choices',()=>{
  expect(css).toContain('.chapter-text.restored');
  expect(css).toContain('.work-entry-copy h1');
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  expect(css).toContain('@media(max-width:430px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(live).toContain("import './reader-book-finish.css';");
  for(const choice of ['palace-reader-font','palace-reader-measure','palace-reader-face','palace-reader-leading','palace-reader-tone']){
   expect(live).toContain(choice);
  }
 });
 it('prevents wide content from breaking mobile chapters and controls',()=>{
  expect(css).toContain(':is(img,svg,video,canvas)');
  expect(css).toContain(':is(pre,table)');
  expect(css).toContain('overflow-x:auto');
  expect(css).toContain('.reader-head-actions');
  expect(css).toContain('overflow:visible');
  expect(css).toContain('max-width:100%');
  expect(css).toContain('.reader-quick-jump select');
  expect(css).toContain('min-height:44px');
 });
 it('retains night, daytime and reading tone support',()=>{
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('.reader-page.tone-paper');
  expect(css).toContain('.reader-page.tone-soft');
  expect(css).toContain('.work-cover.restored');
 });
});
