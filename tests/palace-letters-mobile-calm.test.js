import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const all=readFileSync('src/liveRooms.jsx','utf8');
const letters=all.split('export function LettersLive({Frame})')[1].split('export function ',2)[0];
const css=readFileSync('src/palace-letters-mobile-calm.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');

describe('Palace Letters correspondence-first mobile layout',()=>{
 it('preserves message-request approvals while moving At the Door into its own filter',()=>{
  expect(letters).toContain("['requests','At the Door']");
  expect(letters).toContain("filter==='requests'&&<section");
  expect(letters).toContain("filter!=='requests'&&<div");
  expect(letters).toContain("respond(r.id,'accepted')");
  expect(letters).toContain("respond(r.id,'declined')");
  expect(letters).toContain("c.preference?.archived");
 });
 it('keeps composing drafts and sending, with full-width textarea layout',()=>{
  expect(letters).toContain('className="letter-compose-input"');
  expect(letters).toContain('className="letter-compose-footer"');
  expect(letters).toContain('maxLength="4000"');
  expect(letters).toContain('onSubmit={send}');
  expect(letters).toContain('changeLetterBody');
  expect(letters).toContain('draftKey(selected)');
  expect(css).toContain('.letter-compose-input>textarea');
  expect(css).toContain('width:100%!important');
  expect(css).toContain('font-size:16px!important');
 });
 it('keeps Star and Mute accessible and hides Archive Exile and Report behind More',()=>{
  expect(letters).toContain('aria-label="More conversation options"');
  expect(letters).toContain('aria-expanded={letterOptionsOpen}');
  expect(letters).toContain('letterOptionsOpen&&<div');
  expect(letters).toContain('Archive conversation');
  expect(letters).toContain('Exile member');
  expect(letters).toContain('Report conversation');
  expect(letters).toContain('onClick={()=>pref({starred:!');
  expect(letters).toContain('onClick={()=>pref({muted:!');
  expect(letters).toContain('<PalaceDialog open={boundaryOpen}');
  expect(letters).toContain('<PalaceDialog open={reportOpen}');
 });
 it('makes mobile conversation list full-width rather than fixed horizontal cards',()=>{
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(css).toContain('overflow-x:hidden!important');
  expect(css).toContain('.chic-letter-list>button');
  expect(css).toContain('width:100%!important');
  expect(css).toContain('text-overflow:ellipsis');
 });
 it('compacts statistics and makes the inbox filters visibly scrollable',()=>{
  expect(css).toContain('.letters-filter-rail:after');
  expect(css).toContain('.letters-stats>span');
  expect(css).toContain('scroll-snap-type:x proximity');
  expect(letters).toContain('Search Palace Letters');
  expect(letters).toContain('New Palace Letter');
 });
 it('protects bottom clearance, timestamp contrast and current header design',()=>{
  expect(shell).toContain("import './palace-letters-mobile-calm.css';");
  expect(css).toContain('padding-bottom:max(120px,var(--palace-mobile-dock-clearance,120px))');
  expect(css).toContain('.chic-letter-stream article time');
  expect(css).not.toContain('top-icon-link');
  expect(css).not.toContain('header.topbar.full-topbar');
 });
});
