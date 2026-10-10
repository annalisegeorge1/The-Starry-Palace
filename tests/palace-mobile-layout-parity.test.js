import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shell=readFileSync('src/main.jsx','utf8');
const parity=readFileSync('src/palace-mobile-theme-parity.css','utf8');
const chamber=readFileSync('src/member-chamber-journey.css','utf8');
const reader=readFileSync('src/liveRooms.jsx','utf8');
const chat=readFileSync('src/PalaceChatDrawer.jsx','utf8');

describe('Phone uses the shared Palace palette and legible room layouts',()=>{
 it('does not apply a different mobile-only topbar or Writing Chamber hero palette',()=>{
  expect(shell).toContain("import './palace-mobile-theme-parity.css';");
  expect(shell).toContain("import './member-chamber-journey.css';");
  expect(parity).not.toContain('.palace-shell.nightfall .full-topbar{');
  expect(parity).not.toContain('.palace-shell.daylight .full-topbar{');
  expect(parity).not.toContain('.palace-shell.nightfall .chic-writing-head{');
  expect(parity).not.toContain('.palace-shell.daylight .chic-writing-head{');
  expect(parity).toContain('.palace-shell.nightfall .mobile-palace-dock');
  expect(parity).toContain('.palace-shell.daylight .mobile-palace-dock');
 });
 it('keeps the honour wall one complete card wide on phones, including custom layouts',()=>{
  expect(chamber).toContain('.gallery-layout-classic,.gallery-layout-compact,.gallery-layout-spotlight');
  expect(chamber).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(chamber).toContain('.chamber-atelier-art-card .chamber-atelier-art-stage');
  expect(chamber).toContain('.chamber-atelier-art-card .chamber-art-arrange');
  expect(reader).toContain('onClick={()=>moveChamberArt("achievement"');
  expect(reader).toContain('onClick={()=>moveChamberArt("gift"');
  expect(reader).toContain('<PalaceBadge family={x.achievement_families} tier={x.display_tier}/>');
 });
 it('enforces horizontally written labels under writing numbers in a two-column layout',()=>{
  expect(chamber).toContain('.chic-writing-head .chic-writing-summary');
  expect(chamber).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(chamber).toContain('writing-mode:horizontal-tb!important');
  expect(chamber).toContain('word-break:normal!important');
  expect(reader).toContain('words across drafts');
  expect(reader).toContain('scheduled chapters');
 });
 it('keeps a visible, accessible Chat launcher without covering half the page',()=>{
  expect(chamber).toContain('.palace-chat-v2.palace-chat-dock:not(.is-open) .palace-chat-launch');
  expect(chamber).toContain('width:49px!important');
  expect(chamber).toContain('height:49px!important');
  expect(chat).toContain("aria-label={'Open Palace chat'");
  expect(chat).toContain('className="palace-chat-mobile-close"');
 });
 it('does not make the page passage sticky on phones',()=>{
  expect(chamber).toContain('.palace-shell .palace-passage');
  expect(chamber).toContain('position:relative!important');
  expect(chamber).toContain('scroll-snap-type:x proximity');
 });
});
