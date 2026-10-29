import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {libraryTabScrollLeft} from './libraryTabScroll';

describe('mobile Library screenshot fixes',()=>{
 const css=readFileSync('src/mobile-reading-chamber-review.css','utf8');
 const rooms=readFileSync('src/liveRooms.jsx','utf8');
 const shell=readFileSync('src/main.jsx','utf8');
 it('centres the chosen Library tab horizontally without changing the vertical page position',()=>{
  expect(libraryTabScrollLeft({railWidth:320,railLeft:0,tabLeft:510,tabWidth:95})).toBe(398);
  expect(libraryTabScrollLeft({railWidth:320,railLeft:0,tabLeft:0,tabWidth:95})).toBe(0);
  expect(libraryTabScrollLeft({railWidth:0,tabLeft:200})).toBe(0);
  const library=rooms.split('export function LibraryLive({Frame})')[1]?.split('export function ')[0]||'';
  expect(library).toContain('ref={libraryTabsRef}');
  expect(library).toContain('rail.scrollLeft=libraryTabScrollLeft(');
  expect(library).toContain('aria-pressed={tab===k}');
 });
 it('stops library tabs and search floating over cards on small screens',()=>{
  expect(css).toContain('[data-palace-room="library"] .chic-library-page .library-tabs.chic-library-tabs');
  expect(css).toContain('position:relative!important');
  expect(css).toContain('top:auto!important');
  expect(css).toContain('overscroll-behavior-inline:contain');
  expect(css).toContain('.library-search-live.chic-library-search');
 });
 it('makes all four Library statistics visible without an overflowing horizontal strip',()=>{
  expect(css).toContain('.library-pulse.chic-library-pulse');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('overflow:visible!important');
  expect(css).toContain('flex:none!important');
 });
 it('keeps chat available as a compact portal launcher, while using More for theme',()=>{
  expect(shell).toContain("document.body.dataset.palaceRoom=activeRoom?.id||'unknown'");
  expect(css).toContain('body[data-palace-room="library"] .palace-chat-dock:not(.is-open)');
  expect(css).toContain('.palace-chat-launch');
  expect(css).toContain('.restored-floating-controls .theme-orb');
  expect(shell).toContain("Switch to Daylight");
  expect(shell).toContain("Switch to Nightfall");
 });
 it('keeps Library search and Letters accessible without redundant mobile floating links',()=>{
  expect(css).toContain('[data-palace-room="library"] .full-topbar .global-search-live');
  expect(css).toContain('[data-palace-room="library"] .restored-floating-controls .notification-anchor');
  expect(shell).toContain('aria-label="Open Palace quick navigation"');
  expect(shell).toContain('className="top-icon-link" to="/letters"');
  expect(shell).toContain('className="float-btn theme-orb"');
  expect(rooms).toContain('aria-label="Search the current Library shelf"');
 });
});
